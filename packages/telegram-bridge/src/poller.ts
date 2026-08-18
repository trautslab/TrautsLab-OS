/**
 * TrautsLab OS — Telegram Long-Polling Daemon
 * Connects the bot directly to Telegram Bot API for real-time bidirectional messaging
 */

import { TelegramBotBridge, TelegramMessage } from './bot.js';
import { getTelegramConfig } from './notifier.js';

export class TelegramPoller {
  private botToken: string;
  private allowedUserIds: number[];
  private bridge: TelegramBotBridge;
  private isRunning: boolean = false;
  private offset: number = 0;

  constructor(options?: {
    botToken?: string;
    allowedUserIds?: number[];
    vaultPath?: string;
  }) {
    const config = getTelegramConfig();
    this.botToken = options?.botToken || config.botToken || '';
    const mainUser = parseInt(config.chatId || '8431939545', 10);
    this.allowedUserIds = options?.allowedUserIds || (isNaN(mainUser) ? [] : [mainUser]);

    this.bridge = new TelegramBotBridge({
      allowedUserIds: this.allowedUserIds,
      vaultPath: options?.vaultPath
    });
  }

  public async start(): Promise<void> {
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN no configurado en .env.');
    }

    this.isRunning = true;
    console.log(`🤖 [TelegramPoller] Bot activo escuchando mensajes... (Usuarios permitidos: ${this.allowedUserIds.join(', ')})`);

    // Main polling loop
    while (this.isRunning) {
      try {
        const url = `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${this.offset}&timeout=20`;
        const res = await fetch(url, { method: 'GET' });

        if (!res.ok) {
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        const data = await res.json() as { ok: boolean; result: any[] };
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.offset = update.update_id + 1;

            if (update.message) {
              const msg = update.message;
              const telegramMsg: TelegramMessage = {
                messageId: msg.message_id,
                chatId: msg.chat.id,
                userId: msg.from.id,
                text: msg.text,
                voiceFileId: msg.voice?.file_id,
                date: msg.date
              };

              console.log(`📩 [TelegramPoller] Mensaje de @${msg.from.username || msg.from.first_name} (${msg.from.id}): "${msg.text || '[Audio]'}"`);

              // Process via Bridge
              const reply = await this.bridge.handleMessage(telegramMsg);

              // Send response back to Telegram
              await this.sendMessage(reply.chatId, reply.text);
            }
          }
        }
      } catch (err: any) {
        if (this.isRunning) {
          console.warn(`[TelegramPoller] Error en polling:`, err.message);
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }
  }

  public stop(): void {
    this.isRunning = false;
    console.log(`[TelegramPoller] Bot detenido.`);
  }

  private async sendMessage(chatId: number, text: string): Promise<void> {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'Markdown'
        })
      });
    } catch (e: any) {
      console.error(`[TelegramPoller] Error enviando respuesta:`, e.message);
    }
  }
}
