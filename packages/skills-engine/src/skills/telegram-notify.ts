/**
 * TrautsLab OS — Telegram Notification & Message Skill
 * Sends immediate or delayed push notifications, custom alerts and reminders to Jhonny Lorenzo via @TrautsLabBot.
 */

import { sendTelegramNotification } from '@trautslab/telegram-bridge';
import { Skill, SkillContext, SkillMetadata, SkillResult } from '../types.js';

export class TelegramNotifySkill implements Skill {
  metadata: SkillMetadata = {
    id: 'telegram-notify',
    name: 'Telegram Push Notifier & Reminder Dispatcher',
    domain: 'operations',
    description: 'Envía notificaciones push, recordatorios programados (ej: en 2 minutos) y avisos directos al Telegram de Jhonny Lorenzo (@TrautsLabBot).',
    tier: 1
  };

  async execute(ctx: SkillContext): Promise<SkillResult> {
    const rawQuery = String(ctx.args?.query || ctx.args?.text || '');
    const customMessage = String(ctx.args?.message || ctx.args?.text || rawQuery || 'Notificación del sistema TrautsLab OS');
    const customTitle = String(ctx.args?.title || 'Aviso de TrautsLab OS');

    // Clean up query prefixes if present in rawQuery
    let cleanMessage = customMessage;
    if (!ctx.args?.message && rawQuery) {
      cleanMessage = rawQuery
        .replace(/^(envía|envia|enviar|manda|mandar|notifica|notificar|avisa|avisar|hazme un recordatorio|recuérdame|recuerdame|notifícame|notificame|mándame|mandame|puedes mandarme|puedes decirme|puedes notificarme)\s*(un mensaje|una notificación|notificación|al telegram|a telegram|en telegram|por telegram|que diga|diciendo)?\s*(a telegram|en telegram|por telegram|al bot)?\s*(para|que diga|diciendo|:)?\s*/i, '')
        .replace(/\b(dentro de|en)\s*\d+\s*(minutos?|segundos?|horas?)\b/gi, '')
        .trim();
    }

    if (!cleanMessage) {
      cleanMessage = 'Alerta solicitada desde TrautsLab OS.';
    }

    // Check for delayed notifications (e.g. "dentro de dos minutos", "en 1 minuto", "en 30 segundos")
    let delaySeconds = Number(ctx.args?.delaySeconds || 0);
    if (!delaySeconds && ctx.args?.delayMinutes) {
      delaySeconds = Number(ctx.args?.delayMinutes) * 60;
    }
    if (!delaySeconds && rawQuery) {
      const matchMin = rawQuery.match(/dentro de (dos|\d+)\s*minuto|en (dos|\d+)\s*minuto/i);
      if (matchMin) {
        const valStr = matchMin[1] || matchMin[2];
        const mins = valStr.toLowerCase() === 'dos' ? 2 : parseInt(valStr, 10) || 1;
        delaySeconds = mins * 60;
      }
      const matchSec = rawQuery.match(/dentro de (\d+)\s*segundo|en (\d+)\s*segundo/i);
      if (matchSec) {
        delaySeconds = parseInt(matchSec[1] || matchSec[2] || '30', 10);
      }
    }

    // If user requested a delayed notification
    if (delaySeconds > 0) {
      const delayMs = delaySeconds * 1000;
      const delayDesc = delaySeconds >= 60 ? `${Math.round(delaySeconds / 60)} minuto(s)` : `${delaySeconds} segundo(s)`;

      setTimeout(async () => {
        try {
          await sendTelegramNotification(`⏰ Recordatorio (${delayDesc})`, cleanMessage, {
            priority: (ctx.args?.priority as 'high' | 'normal' | 'low') || 'high'
          });
        } catch (err) {
          console.error('[TelegramNotifySkill] Error enviando notificación diferida:', err);
        }
      }, delayMs);

      return {
        success: true,
        skillId: this.metadata.id,
        executionTimeMs: 0,
        message: `✓ Recordatorio programado: te enviaré una notificación a Telegram en ${delayDesc} para '${cleanMessage}'.`
      };
    }

    // Immediate Notification
    const result = await sendTelegramNotification(customTitle, cleanMessage, {
      priority: (ctx.args?.priority as 'high' | 'normal' | 'low') || 'high'
    });

    if (result.sent) {
      return {
        success: true,
        skillId: this.metadata.id,
        executionTimeMs: 0,
        message: `✓ He enviado la notificación a tu Telegram: "${cleanMessage}".`
      };
    } else {
      return {
        success: false,
        skillId: this.metadata.id,
        executionTimeMs: 0,
        message: `No se pudo enviar la notificación a Telegram: ${result.reason || result.error || 'Error de conexión'}`,
        error: result.error || result.reason
      };
    }
  }
}
