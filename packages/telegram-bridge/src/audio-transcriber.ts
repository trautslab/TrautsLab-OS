/**
 * TrautsLab OS — Telegram Real Audio Transcriber & Observability Engine
 * Downloads OGG Opus voice notes from Telegram and transcribes them locally via Whisper-CLI and FFmpeg.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const execFileAsync = promisify(execFile);

export interface AudioStageTrace {
  name: 'DOWNLOAD_OGA' | 'FFMPEG_CONVERT' | 'WHISPER_STT' | 'VOICE_PIPELINE_ROUTE' | 'TELEGRAM_REPLY';
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  latencyMs: number;
  details?: string;
  error?: string;
}

export interface AudioTelemetryTrace {
  id: string;
  timestamp: string;
  timePeru: string;
  source: 'telegram' | 'web_pwa' | 'desktop';
  fileId?: string;
  fileSizeBytes?: number;
  stages: AudioStageTrace[];
  totalLatencyMs: number;
  transcribedText?: string;
  pipelineTier?: string;
  responsePlainText?: string;
  overallStatus: 'SUCCESS' | 'ERROR';
}

// In-memory trace history (last 50 audio requests)
export const globalAudioTraces: AudioTelemetryTrace[] = [];

export function recordAudioTrace(trace: AudioTelemetryTrace) {
  globalAudioTraces.unshift(trace);
  if (globalAudioTraces.length > 50) globalAudioTraces.pop();

  // Also persist to Obsidian Vault cache
  try {
    const vaultPath = process.env.OBSIDIAN_VAULT_ROOT || '/Users/jlorenzor/Documents/Obsidian Vault';
    const cacheDir = path.join(vaultPath, 'OUTPUT', 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const cachePath = path.join(cacheDir, 'audio-observability.json');
    fs.writeFileSync(cachePath, JSON.stringify({
      last_updated: new Date().toISOString(),
      traces_count: globalAudioTraces.length,
      latest_trace: trace,
      recent_traces: globalAudioTraces.slice(0, 10)
    }, null, 2), 'utf-8');
  } catch {}
}

export interface AudioTranscriptionResult {
  text: string;
  latencyMs: number;
  trace: AudioTelemetryTrace;
  error?: string;
}

export class TelegramAudioTranscriber {
  private modelPath: string;
  private whisperBinPath: string;
  private ffmpegBinPath: string;

  constructor(modelPath?: string) {
    const candidateModels = [
      '/Users/jlorenzor/Documents/TrautsLab-OS/packages/voice-engine/models/ggml-large-v3-turbo.bin',
      '/Users/jlorenzor/Documents/TrautsLab-OS/packages/voice-engine/models/ggml-small.bin',
      '/Users/jlorenzor/Documents/TrautsLab-OS/packages/voice-engine/models/ggml-base.bin'
    ];
    this.modelPath = modelPath || candidateModels.find(p => fs.existsSync(p)) || candidateModels[1];

    // Auto-detect Whisper binary
    const candidateWhisperBins = [
      '/opt/homebrew/bin/whisper-cli',
      '/usr/local/bin/whisper-cli',
      '/opt/homebrew/bin/whisper-cpp',
      '/usr/local/bin/whisper-cpp'
    ];
    this.whisperBinPath = candidateWhisperBins.find(p => fs.existsSync(p)) || '/opt/homebrew/bin/whisper-cli';

    // Auto-detect FFmpeg binary
    const candidateFfmpegBins = [
      '/opt/homebrew/bin/ffmpeg',
      '/usr/local/bin/ffmpeg',
      'ffmpeg'
    ];
    this.ffmpegBinPath = candidateFfmpegBins.find(p => fs.existsSync(p)) || '/opt/homebrew/bin/ffmpeg';
  }

  /**
   * Downloads a voice note from Telegram API and transcribes it locally
   */
  public async transcribeVoiceFile(botToken: string, fileId: string): Promise<AudioTranscriptionResult> {
    const totalStart = Date.now();
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const nowPeru = new Date().toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      hour12: true,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const stages: AudioStageTrace[] = [];
    const tempDir = os.tmpdir();
    const ogaPath = path.join(tempDir, `tg_voice_${Date.now()}_${Math.random().toString(36).substring(7)}.oga`);
    const wavPath = path.join(tempDir, `tg_voice_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);

    let fileSizeBytes = 0;
    let transcribedText = '';
    let hasError = false;

    // --- ETAPA 1: DOWNLOAD_OGA ---
    const stage1Start = Date.now();
    try {
      const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
      const fileInfoRes = await fetch(getFileUrl);
      if (!fileInfoRes.ok) throw new Error(`Telegram getFile HTTP error: ${fileInfoRes.status}`);

      const fileInfo = await fileInfoRes.json() as { ok: boolean; result?: { file_path: string } };
      if (!fileInfo.ok || !fileInfo.result?.file_path) throw new Error('Telegram no devolvió file_path');

      const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.result.file_path}`;
      const audioRes = await fetch(downloadUrl);
      if (!audioRes.ok) throw new Error(`Telegram download error: ${audioRes.status}`);

      const buffer = Buffer.from(await audioRes.arrayBuffer());
      fileSizeBytes = buffer.length;
      await fs.promises.writeFile(ogaPath, buffer);

      stages.push({
        name: 'DOWNLOAD_OGA',
        status: 'SUCCESS',
        latencyMs: Date.now() - stage1Start,
        details: `Descargado archivo ${fileInfo.result.file_path} (${fileSizeBytes} bytes)`
      });
    } catch (err: any) {
      hasError = true;
      stages.push({
        name: 'DOWNLOAD_OGA',
        status: 'ERROR',
        latencyMs: Date.now() - stage1Start,
        error: err.message
      });
    }

    // --- ETAPA 2: FFMPEG_CONVERT ---
    const stage2Start = Date.now();
    if (!hasError) {
      try {
        await execFileAsync(this.ffmpegBinPath, [
          '-y',
          '-i', ogaPath,
          '-ar', '16000',
          '-ac', '1',
          '-c:a', 'pcm_s16le',
          wavPath
        ]);

        const wavStats = await fs.promises.stat(wavPath);
        stages.push({
          name: 'FFMPEG_CONVERT',
          status: 'SUCCESS',
          latencyMs: Date.now() - stage2Start,
          details: `Convertido a 16kHz mono WAV (${wavStats.size} bytes)`
        });
      } catch (err: any) {
        hasError = true;
        stages.push({
          name: 'FFMPEG_CONVERT',
          status: 'ERROR',
          latencyMs: Date.now() - stage2Start,
          error: `Ffmpeg fallo: ${err.message}`
        });
      }
    }

    // --- ETAPA 3: WHISPER_STT ---
    const stage3Start = Date.now();
    if (!hasError) {
      try {
        if (!fs.existsSync(this.modelPath)) {
          throw new Error(`Modelo Whisper no encontrado en ${this.modelPath}`);
        }
        if (!fs.existsSync(this.whisperBinPath)) {
          throw new Error(`Binario Whisper no encontrado en ${this.whisperBinPath}`);
        }

        const { stdout, stderr } = await execFileAsync(this.whisperBinPath, [
          '-m', this.modelPath,
          '-l', 'es',
          '--no-timestamps',
          '--prompt', 'Archivar el día, agenda, calendario, reunión, compromiso, cena, Spiderman, Centro Cívico, mañana, hoy, completar tarea.',
          '-f', wavPath
        ]);

        let rawTranscribed = stdout
          .split('\n')
          .map(line => line.replace(/\[\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}\.\d{3}\]/g, '').trim())
          .filter(Boolean)
          .join(' ')
          .trim();

        // High-Precision Spanish Phonetic Normalizer
        transcribedText = rawTranscribed
          .replace(/\barchibar\b/gi, 'Archivar')
          .replace(/\bel lía\b/gi, 'el día')
          .replace(/\bel lia\b/gi, 'el día')
          .replace(/\blda\b/gi, 'el día')
          .replace(/\bcentros híbicos\b/gi, 'Centro Cívico')
          .replace(/\bcentrosíbico\b/gi, 'Centro Cívico')
          .replace(/\ba género\b/gi, 'agéndalo')
          .replace(/\ba genero\b/gi, 'agéndalo');

        if (!transcribedText) {
          transcribedText = 'Audio recibido sin voz detectable';
        }

        stages.push({
          name: 'WHISPER_STT',
          status: 'SUCCESS',
          latencyMs: Date.now() - stage3Start,
          details: `Modelo [${path.basename(this.modelPath)}] inferido en GPU Metal: "${transcribedText}"`
        });
      } catch (err: any) {
        hasError = true;
        stages.push({
          name: 'WHISPER_STT',
          status: 'ERROR',
          latencyMs: Date.now() - stage3Start,
          error: `Whisper STT fallo: ${err.message}`
        });
      }
    }

    // Fallback if failed
    if (hasError && !transcribedText) {
      transcribedText = 'Error en reconocimiento de voz';
    }

    const totalLatencyMs = Date.now() - totalStart;

    const trace: AudioTelemetryTrace = {
      id: traceId,
      timestamp: new Date().toISOString(),
      timePeru: nowPeru,
      source: 'telegram',
      fileId,
      fileSizeBytes,
      stages,
      totalLatencyMs,
      transcribedText,
      overallStatus: hasError ? 'ERROR' : 'SUCCESS'
    };

    recordAudioTrace(trace);
    console.log(`🎙️ [Observability] Audio Trace ${traceId} [${trace.overallStatus}] en ${totalLatencyMs}ms: "${transcribedText}"`);

    // Clean temp files
    try {
      if (fs.existsSync(ogaPath)) await fs.promises.unlink(ogaPath);
      if (fs.existsSync(wavPath)) await fs.promises.unlink(wavPath);
    } catch {}

    return {
      text: transcribedText,
      latencyMs: totalLatencyMs,
      trace
    };
  }
}
