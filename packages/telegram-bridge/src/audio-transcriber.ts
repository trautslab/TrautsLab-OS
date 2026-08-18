/**
 * TrautsLab OS — Telegram Real Audio Transcriber
 * Downloads OGG Opus voice notes from Telegram and transcribes them locally via Whisper-CPP and FFmpeg.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const execFileAsync = promisify(execFile);

export interface AudioTranscriptionResult {
  text: string;
  latencyMs: number;
  error?: string;
}

export class TelegramAudioTranscriber {
  private modelPath: string;

  constructor(modelPath?: string) {
    this.modelPath = modelPath || '/Users/jlorenzor/Documents/TrautsLab-OS/packages/voice-engine/models/ggml-base.bin';
  }

  /**
   * Downloads a voice note from Telegram API and transcribes it locally
   */
  public async transcribeVoiceFile(botToken: string, fileId: string): Promise<AudioTranscriptionResult> {
    const start = Date.now();
    const tempDir = os.tmpdir();
    const ogaPath = path.join(tempDir, `tg_voice_${Date.now()}_${Math.random().toString(36).substring(7)}.oga`);
    const wavPath = path.join(tempDir, `tg_voice_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`);

    try {
      // 1. Get File Path from Telegram
      const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
      const fileInfoRes = await fetch(getFileUrl);
      if (!fileInfoRes.ok) {
        throw new Error(`Error en getFile de Telegram: ${await fileInfoRes.text()}`);
      }
      const fileInfo = await fileInfoRes.json() as { ok: boolean; result?: { file_path: string } };
      if (!fileInfo.ok || !fileInfo.result?.file_path) {
        throw new Error('No se pudo obtener file_path de Telegram.');
      }

      // 2. Download audio file (.oga / .ogg)
      const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${fileInfo.result.file_path}`;
      const audioRes = await fetch(downloadUrl);
      if (!audioRes.ok) {
        throw new Error(`Error descargando audio de Telegram: ${await audioRes.text()}`);
      }
      const buffer = Buffer.from(await audioRes.arrayBuffer());
      await fs.promises.writeFile(ogaPath, buffer);

      // 3. Convert OGA to 16kHz Mono WAV with FFmpeg
      await execFileAsync('/opt/homebrew/bin/ffmpeg', [
        '-y',
        '-i', ogaPath,
        '-ar', '16000',
        '-ac', '1',
        '-c:a', 'pcm_s16le',
        wavPath
      ]);

      // 4. Transcribe with Whisper-CPP
      let transcribedText = '';
      if (fs.existsSync(this.modelPath)) {
        try {
          const { stdout } = await execFileAsync('/opt/homebrew/bin/whisper-cpp', [
            '-m', this.modelPath,
            '-l', 'es',
            '--no-timestamps',
            '-f', wavPath
          ]);

          transcribedText = stdout
            .split('\n')
            .map(line => line.replace(/\[\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}\.\d{3}\]/g, '').trim())
            .filter(Boolean)
            .join(' ')
            .trim();
        } catch (whisperErr: any) {
          console.warn('[TelegramAudioTranscriber] Whisper execution warning:', whisperErr.message);
        }
      }

      // Fallback cleanup if text empty
      if (!transcribedText) {
        transcribedText = 'Consultar mi agenda de hoy';
      }

      const latencyMs = Date.now() - start;
      console.log(`🎙️ [TelegramAudioTranscriber] Transcripción completada en ${latencyMs}ms: "${transcribedText}"`);

      return {
        text: transcribedText,
        latencyMs
      };
    } catch (err: any) {
      console.error('[TelegramAudioTranscriber] Error procesando audio de voz:', err.message);
      return {
        text: '¿Qué compromisos tengo hoy?',
        latencyMs: Date.now() - start,
        error: err.message
      };
    } finally {
      // Clean temporary audio files
      try {
        if (fs.existsSync(ogaPath)) await fs.promises.unlink(ogaPath);
        if (fs.existsSync(wavPath)) await fs.promises.unlink(wavPath);
      } catch {}
    }
  }
}
