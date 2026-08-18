/**
 * TrautsLab OS — Telegram Push Notifier
 * Sends automated push notifications for calendar events, intel digests, and system alerts.
 */

import path from 'node:path';
import fs from 'node:fs';

export interface TelegramNotificationOptions {
  tag?: string;
  silent?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

export interface TelegramNotificationResult {
  sent: boolean;
  messageId?: number;
  error?: string;
  reason?: string;
}

// In-memory or env config loader
export function getTelegramConfig(): { botToken?: string; chatId?: string } {
  let botToken = process.env.TELEGRAM_BOT_TOKEN;
  let chatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ALLOWED_USER_ID;

  if (!botToken || !chatId) {
    // Try reading from .env in project root
    const envPaths = [
      path.resolve(process.cwd(), '.env'),
      path.resolve(process.cwd(), '../../.env'),
      path.resolve('/Users/jlorenzor/Documents/TrautsLab-OS/.env')
    ];

    for (const envPath of envPaths) {
      if (fs.existsSync(envPath)) {
        try {
          const content = fs.readFileSync(envPath, 'utf-8');
          for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (trimmed.startsWith('TELEGRAM_BOT_TOKEN=')) {
              botToken = trimmed.replace('TELEGRAM_BOT_TOKEN=', '').replace(/["']/g, '').trim();
            }
            if (trimmed.startsWith('TELEGRAM_CHAT_ID=') || trimmed.startsWith('TELEGRAM_ALLOWED_USER_ID=')) {
              chatId = trimmed.split('=')[1]?.replace(/["']/g, '').trim();
            }
          }
          if (botToken && chatId) break;
        } catch {}
      }
    }
  }

  return { botToken, chatId };
}

/**
 * Send a formatted push notification to Telegram
 */
export async function sendTelegramNotification(
  title: string,
  message: string,
  options?: TelegramNotificationOptions
): Promise<TelegramNotificationResult> {
  const { botToken, chatId } = getTelegramConfig();

  if (!botToken || !chatId) {
    const reason = 'TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados en .env o variables de entorno.';
    console.log(`[TelegramNotifier] ℹ️ Notificación no enviada (${reason})`);
    return { sent: false, reason };
  }

  const nowPeru = new Date().toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    hour12: true,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedText = 
    `🤖 *TrautsLab OS • Notificación*\n` +
    `📌 *${title.replace(/[*_`]/g, '')}*\n\n` +
    `${message}\n\n` +
    `🕒 _${nowPeru} (PET / UTC-5 - Hora Perú)_\n` +
    `👤 _Propietario: Jhonny Lorenzo_`;

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedText,
        parse_mode: 'Markdown',
        disable_notification: options?.silent === true
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[TelegramNotifier] Error en respuesta de Telegram API:`, errText);
      return { sent: false, error: errText };
    }

    const data = await res.json() as { ok: boolean; result?: { message_id: number } };
    console.log(`[TelegramNotifier] ✓ Notificación push enviada a Telegram (Msg ID: ${data.result?.message_id})`);
    return {
      sent: true,
      messageId: data.result?.message_id
    };
  } catch (err: any) {
    console.error(`[TelegramNotifier] Excepción al enviar mensaje a Telegram:`, err.message);
    return { sent: false, error: err.message };
  }
}
