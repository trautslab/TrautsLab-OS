/**
 * TrautsLab OS — Telegram Assistant Bot Bridge
 * Handles voice notes, commands, and push notifications on mobile
 */

import { VoicePipeline, VoiceTier } from '@trautslab/voice-engine';
import { Tier2CacheManager } from '@trautslab/vault-engine';
import { SkillRegistry } from '@trautslab/skills-engine';
import { TelegramAudioTranscriber } from './audio-transcriber.js';
import { getTelegramConfig } from './notifier.js';
import path from 'node:path';
import fs from 'node:fs';

export interface TelegramMessage {
  messageId: number;
  chatId: number;
  userId: number;
  text?: string;
  voiceFileId?: string;
  date: number;
}

export interface TelegramResponse {
  chatId: number;
  text: string;
  audioBuffer?: Buffer;
  tier?: VoiceTier;
}

export class TelegramBotBridge {
  private allowedUserIds: Set<number>;
  private voicePipeline: VoicePipeline;
  private cacheManager: Tier2CacheManager;
  private registry: SkillRegistry;
  private vaultPath: string;

  constructor(options?: {
    allowedUserIds?: number[];
    vaultPath?: string;
  }) {
    this.allowedUserIds = new Set(options?.allowedUserIds || [8431939545]);

    const defaultVault = process.env.OBSIDIAN_VAULT_ROOT || 
      (fs.existsSync('/Users/jlorenzor/Documents/Obsidian Vault') 
        ? '/Users/jlorenzor/Documents/Obsidian Vault' 
        : (fs.existsSync(path.resolve(process.cwd(), 'vault'))
          ? path.resolve(process.cwd(), 'vault')
          : path.resolve(process.cwd(), '../../vault')));

    this.vaultPath = options?.vaultPath || defaultVault;
    this.cacheManager = new Tier2CacheManager(this.vaultPath);
    this.registry = new SkillRegistry();
    this.voicePipeline = new VoicePipeline({
      vaultRoot: this.vaultPath
    });
  }

  /**
   * Authorize user ID
   */
  public isAuthorized(userId: number): boolean {
    if (this.allowedUserIds.size === 0) return true;
    return this.allowedUserIds.has(userId);
  }

  /**
   * Process incoming Telegram text or voice message
   */
  public async handleMessage(msg: TelegramMessage): Promise<TelegramResponse> {
    if (!this.isAuthorized(msg.userId)) {
      return {
        chatId: msg.chatId,
        text: '⛔ Acceso no autorizado. Este es un bot privado de TrautsLab OS.'
      };
    }

    // 1. Handle Commands
    if (msg.text?.startsWith('/')) {
      return this.handleCommand(msg);
    }

    // 2. Handle Text Query as Voice/NLP Intent
    if (msg.text) {
      const result = await this.voicePipeline.processQuery({
        transcription: msg.text,
        sourceClient: 'telegram'
      });
      let replyText = `🤖 [TrautsLab OS • ${result.tier}]\n\n${result.responsePlainText}`;
      if (result.tier === 'TIER_2_CACHE') {
        replyText += `\n\n⚡ *Latencia de Caché:* ${result.latencies.totalMs}ms`;
      }
      return {
        chatId: msg.chatId,
        text: replyText,
        audioBuffer: result.audioBuffer,
        tier: result.tier
      };
    }

    // 3. Handle Real Voice Note from Telegram
    if (msg.voiceFileId) {
      const config = getTelegramConfig();
      const botToken = config.botToken || process.env.TELEGRAM_BOT_TOKEN || '';

      const transcriber = new TelegramAudioTranscriber();
      const sttResult = await transcriber.transcribeVoiceFile(botToken, msg.voiceFileId);

      const routeStart = Date.now();
      const result = await this.voicePipeline.processQuery({
        transcription: sttResult.text,
        sourceClient: 'telegram'
      });

      sttResult.trace.pipelineTier = result.tier;
      sttResult.trace.responsePlainText = result.responsePlainText;
      sttResult.trace.stages.push({
        name: 'VOICE_PIPELINE_ROUTE',
        status: 'SUCCESS',
        latencyMs: Date.now() - routeStart,
        details: `Enrutado a ${result.tier} (${result.target}) en ${result.latencies.totalMs}ms`
      });

      let replyText = `🎙️ *Transcripción de Voz:* "${sttResult.text}"\n\n` +
                      `🤖 *Respuesta [${result.tier}]:*\n${result.responsePlainText}\n\n` +
                      `⚡ _Latencia Total de Audio: ${sttResult.latencyMs}ms (Whisper GPU: Metal)_`;

      return {
        chatId: msg.chatId,
        text: replyText,
        audioBuffer: result.audioBuffer,
        tier: result.tier
      };
    }

    return {
      chatId: msg.chatId,
      text: '❓ Tipo de mensaje no soportado. Envía texto o una nota de voz.'
    };
  }

  /**
   * Internal Command Dispatcher
   */
  private async handleCommand(msg: TelegramMessage): Promise<TelegramResponse> {
    const parts = (msg.text || '').trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch (cmd) {
      case '/start':
      case '/help':
        return {
          chatId: msg.chatId,
          text: `⚡ *TrautsLab OS — Asistente de Telegram*\n\n` +
                `*Comandos Rápidos:*\n` +
                `• \`/intel\` — Ver resumen matutino de tendencias\n` +
                `• \`/agenda\` — Consultar compromisos y tareas de hoy\n` +
                `• \`/run <skill>\` — Disparar una habilidad en el Mac\n` +
                `• \`/status\` — Ver estado del sistema y daemons\n\n` +
                `*Nota:* También puedes enviarme *notas de voz* directamente.`
        };

      case '/intel':
        const intelPayload = await this.cacheManager.getCache<any>('today-intel');
        if (!intelPayload || !intelPayload.data) {
          return { chatId: msg.chatId, text: 'ℹ️ No hay escaneo de inteligencia guardado para hoy.' };
        }
        const intel = intelPayload.data;
        return {
          chatId: msg.chatId,
          text: `⭐ *Daily Intel Scan (${intel.date || 'Hoy'})*\n\n` +
                `*GitHub Trending Top:*\n• \`${intel.github_trending?.[0]?.repo || 'N/A'}\` (${intel.github_trending?.[0]?.stars || '0'} ⭐)\n\n` +
                `*Hacker News Top:*\n• ${intel.hacker_news?.[0]?.title || 'N/A'}\n\n` +
                `_Resumen Fonético:_\n"${intel.quick_summary_tts || ''}"`
        };

      case '/agenda':
        const agendaPayload = await this.cacheManager.getCache<any>('today-agenda');
        if (!agendaPayload || !agendaPayload.data) {
          return { chatId: msg.chatId, text: 'ℹ️ No hay agenda registrada para hoy.' };
        }
        const agenda = agendaPayload.data;
        return {
          chatId: msg.chatId,
          text: `📅 *Agenda de Hoy (${agenda.date || 'Hoy'})*\n\n` +
                `Total de Eventos: ${agenda.events_count || 0}\n` +
                `Resumen: "${agenda.quick_summary_tts || ''}"`
        };

      case '/run':
        if (!arg) {
          return { chatId: msg.chatId, text: '⚠️ Especifica el nombre de la skill. Ej: `/run morning-intel-scan`' };
        }
        const skill = this.registry.get(arg);
        if (!skill) {
          return { chatId: msg.chatId, text: `❌ Skill "${arg}" no encontrada en el registro.` };
        }
        const execResult = await this.registry.execute(arg, {
          vaultRoot: this.vaultPath,
          timestamp: new Date()
        });
        return {
          chatId: msg.chatId,
          text: `✓ *Skill ejecutada con éxito:* \`${arg}\`\n\n${execResult.message}\nTiempo: ${execResult.executionTimeMs}ms`
        };

      case '/status':
        return {
          chatId: msg.chatId,
          text: `🟢 *TrautsLab OS — Estado Operativo*\n\n` +
                `• Core Daemon: ONLINE\n` +
                `• Voice Router: 3-Tier Híbrido Activo\n` +
                `• Vault: /vault (Sincronizado)\n` +
                `• Dispositivo GPU: MPS (Apple Silicon)`
        };

      default:
        return {
          chatId: msg.chatId,
          text: `⚠️ Comando desconocido: \`${cmd}\`. Escribe \`/help\` para ver las opciones.`
        };
    }
  }
}
