/**
 * TrautsLab OS — Universal Multi-Day Calendar Event Scheduler
 * Deterministically parses dynamic dates, times, and activities across any time horizon
 * and synchronizes directly into Obsidian Vault markdown notes and Tier 2 caches.
 */

import { Skill, SkillContext, SkillMetadata, SkillResult } from '../types.js';
import { Tier2CacheManager } from '@trautslab/vault-engine';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface ParsedEventDetails {
  title: string;
  time: string;
  targetDate: string; // YYYY-MM-DD
  dateLabel: string;  // "hoy", "mañana", "el 18 de agosto", etc.
}

export class CalendarAddEventSkill implements Skill {
  readonly metadata: SkillMetadata = {
    id: 'calendar-add-event',
    name: 'Calendar Event Scheduler',
    domain: 'productivity',
    tier: 1,
    description: 'Añade o actualiza compromisos para hoy o cualquier fecha futura en Obsidian Vault.'
  };

  async execute(ctx: SkillContext): Promise<SkillResult> {
    const start = Date.now();
    const query = (ctx.args?.eventText as string || ctx.args?.query as string || 'Cena 8:00 PM').trim();
    const baseDate = ctx.timestamp ? new Date(ctx.timestamp) : new Date();

    // 1. Universal Spatio-Temporal Event Parsing (Uses LLM arguments if provided, else fallback parser)
    const parsed = (ctx.args?.title && ctx.args?.time)
      ? {
          title: ctx.args.title as string,
          time: ctx.args.time as string,
          targetDate: (ctx.args.date as string) || baseDate.toISOString().split('T')[0],
          dateLabel: ctx.args.date ? `el ${ctx.args.date}` : 'hoy'
        }
      : this.parseEventDetails(query, baseDate);

    // List all candidate vault locations
    const candidateVaults = [
      '/Users/jlorenzor/Documents/Obsidian Vault',
      path.resolve(process.cwd(), 'vault'),
      ctx.vaultRoot
    ].filter(Boolean);

    const uniqueVaults = Array.from(new Set(candidateVaults));
    const createdArtifacts: string[] = [];

    for (const vaultPath of uniqueVaults) {
      try {
        const outputDir = path.join(vaultPath, 'OUTPUT');
        await fs.mkdir(outputDir, { recursive: true });
        const agendaMdPath = path.join(outputDir, `daily-agenda-${parsed.targetDate}.md`);

        // 2. Read or initialize daily agenda markdown with full frontmatter
        let currentMd = '';
        let exists = false;
        try {
          currentMd = await fs.readFile(agendaMdPath, 'utf-8');
          exists = true;
        } catch {
          currentMd = `---
title: "Agenda y Compromisos Diarios: ${parsed.targetDate}"
domain: "productivity"
created_at: "${parsed.targetDate}"
updated_at: "${parsed.targetDate}"
tags: ["agenda", "calendar", "daily-brief", "tasks"]
summary: "Agenda diaria para Jhonny Lorenzo (${parsed.targetDate})."
---

# Agenda y Compromisos Diarios — ${parsed.targetDate}

> **Estado:** 1 Evento Programado  
> **Propietario:** Jhonny Lorenzo  

---

## 🕒 Cronograma del Día

| Hora | Actividad / Compromiso | Ubicación | Prioridad | Estado |
| :--- | :--- | :--- | :--- | :--- |

---

## 🎯 Notas y Foco del Día
`;
        }

        // 3. Update or Insert Event in Markdown
        const cleanTitle = parsed.title;
        const oldTitleHint = (ctx.args?.oldTitle || ctx.args?.targetEventTitle || '') as string;
        const newRow = `| \`${parsed.time}\` | **${cleanTitle}** | N/A | \`HIGH\` | 🟡 Programado |`;

        let isUpdate = false;
        const directTitleRegex = new RegExp(`\\|[^\\n]*\\*\\*${cleanTitle}\\*\\*[^\\n]*\\|`, 'i');

        if (directTitleRegex.test(currentMd)) {
          isUpdate = true;
          currentMd = currentMd.replace(directTitleRegex, newRow);
        } else if (oldTitleHint && new RegExp(`\\|[^\\n]*${oldTitleHint}[^\\n]*\\|`, 'i').test(currentMd)) {
          isUpdate = true;
          const oldRowRegex = new RegExp(`\\|[^\\n]*${oldTitleHint}[^\\n]*\\|`, 'i');
          currentMd = currentMd.replace(oldRowRegex, newRow);
        } else if (parsed.time && new RegExp('\\|\\s*`' + parsed.time + '`[^\\n]*\\|', 'i').test(currentMd) && (query.toLowerCase().includes('cambia') || query.toLowerCase().includes('edita') || query.toLowerCase().includes('corrige') || query.toLowerCase().includes('modifica'))) {
          isUpdate = true;
          const timeRowRegex = new RegExp('\\|\\s*`' + parsed.time + '`[^\\n]*\\|', 'i');
          currentMd = currentMd.replace(timeRowRegex, newRow);
        } else {
          // Find table insertion position
          const tableHeaderMarker = '| :--- | :--- | :--- | :--- | :--- |\n';
          if (currentMd.includes(tableHeaderMarker)) {
            currentMd = currentMd.replace(tableHeaderMarker, `${tableHeaderMarker}${newRow}\n`);
          } else {
            currentMd += `\n${newRow}\n`;
          }
        }

        await fs.writeFile(agendaMdPath, currentMd, 'utf-8');
        createdArtifacts.push(agendaMdPath);

        // 4. Update Tier 2 Cache if it's for today
        const todayStr = baseDate.toISOString().split('T')[0];
        const cacheMgr = new Tier2CacheManager(vaultPath);
        await cacheMgr.ensureCacheDir();

        if (parsed.targetDate === todayStr) {
          const existingPayload = await cacheMgr.getCache<any>('today-agenda');
          const existingEvents = existingPayload?.data?.events || [];
          const idx = existingEvents.findIndex((e: any) => e.title.toLowerCase() === cleanTitle.toLowerCase());
          
          let updatedEvents: any[] = [];
          if (idx !== -1) {
            updatedEvents = existingEvents.map((e: any, i: number) => i === idx ? { ...e, time: parsed.time } : e);
          } else {
            updatedEvents = [...existingEvents, { time: parsed.time, title: cleanTitle, priority: 'high', status: 'scheduled' }];
          }

          const quickSummary = isUpdate
            ? `He actualizado '${cleanTitle}' para hoy a las ${parsed.time}.`
            : `He agendado '${cleanTitle}' para hoy a las ${parsed.time}. Tienes ${updatedEvents.length} compromisos programados.`;

          await cacheMgr.setCache('today-agenda', {
            schema_version: '1.0',
            category: 'daily_agenda',
            generated_at: new Date().toISOString(),
            expires_at: `${todayStr}T23:59:59Z`,
            quick_summary_tts: quickSummary,
            data: {
              eventsCount: updatedEvents.length,
              events: updatedEvents
            }
          });
        }
      } catch (err) {
        console.warn(`[CalendarAddEventSkill] Warning writing to ${vaultPath}:`, err);
      }
    }

    const actionWord = query.toLowerCase().includes('cambi') || query.toLowerCase().includes('muev') ? 'actualizado' : 'agendado';
    const message = `✓ He ${actionWord} '${parsed.title}' para ${parsed.dateLabel} (${parsed.targetDate}) a las ${parsed.time}. Guardado en tu Obsidian Vault.`;

    // Enviar notificación a Telegram si está configurado
    try {
      const { sendTelegramNotification } = await import('@trautslab/telegram-bridge');
      await sendTelegramNotification(
        '📅 Compromiso en Calendario',
        `Se ha ${actionWord} *${parsed.title}* para ${parsed.dateLabel} (${parsed.targetDate}) a las *${parsed.time}*.\n\nSincronizado en tu Obsidian Vault.`
      );
    } catch {}

    return {
      success: true,
      skillId: this.metadata.id,
      executionTimeMs: Date.now() - start,
      message,
      artifactsCreated: createdArtifacts,
      cacheKeysUpdated: ['today-agenda']
    };
  }

  /**
   * Universal, non-overfitting parser for dates, times and event titles
   */
  public parseEventDetails(raw: string, baseDate: Date = new Date()): ParsedEventDetails {
    const text = raw.trim();
    const lower = text.toLowerCase();

    // 1. Resolve Target Date
    let targetDateObj = new Date(baseDate);
    let dateLabel = 'hoy';

    // Relative dates
    if (lower.includes('pasado mañana') || lower.includes('pasado manana')) {
      targetDateObj.setDate(targetDateObj.getDate() + 2);
      dateLabel = 'pasado mañana';
    } else if (lower.includes('mañana') || lower.includes('manana')) {
      targetDateObj.setDate(targetDateObj.getDate() + 1);
      dateLabel = 'mañana';
    } else if (lower.includes('hoy')) {
      dateLabel = 'hoy';
    } else {
      // Days of the week in Spanish
      const daysMap: Record<string, number> = {
        'domingo': 0, 'lunes': 1, 'martes': 2, 'miércoles': 3, 'miercoles': 3,
        'jueves': 4, 'viernes': 5, 'sábado': 6, 'sabado': 6
      };
      for (const [dayName, dayIndex] of Object.entries(daysMap)) {
        if (new RegExp(`\\b${dayName}\\b`, 'i').test(lower)) {
          const currentDay = baseDate.getDay();
          let diff = dayIndex - currentDay;
          if (diff <= 0) diff += 7; // Next occurrence
          targetDateObj.setDate(targetDateObj.getDate() + diff);
          dateLabel = `el ${dayName}`;
          break;
        }
      }

      // Explicit day and month: e.g. "18 de agosto", "25 de septiembre", "el 18 de ago"
      const monthsMap: Record<string, number> = {
        'enero': 0, 'ene': 0, 'febrero': 1, 'feb': 1, 'marzo': 2, 'mar': 2,
        'abril': 3, 'abr': 3, 'mayo': 4, 'may': 4, 'junio': 5, 'jun': 5,
        'julio': 6, 'jul': 6, 'agosto': 7, 'ago': 7, 'septiembre': 8, 'sep': 8, 'setiembre': 8,
        'octubre': 9, 'oct': 9, 'noviembre': 10, 'nov': 10, 'diciembre': 11, 'dic': 11
      };

      const dateMatch = lower.match(/(?:el\s*)?(\d{1,2})\s*(?:de|\/)\s*([a-záéíóú]+|\d{1,2})/i);
      if (dateMatch) {
        const dayNum = parseInt(dateMatch[1], 10);
        const monthVal = dateMatch[2].toLowerCase();
        let monthNum = -1;

        if (monthsMap[monthVal] !== undefined) {
          monthNum = monthsMap[monthVal];
        } else if (/^\d{1,2}$/.test(monthVal)) {
          monthNum = parseInt(monthVal, 10) - 1;
        }

        if (monthNum >= 0 && monthNum <= 11 && dayNum >= 1 && dayNum <= 31) {
          targetDateObj = new Date(baseDate.getFullYear(), monthNum, dayNum);
          dateLabel = `el ${dayNum} de ${dateMatch[2]}`;
        }
      }
    }

    const targetDate = targetDateObj.toISOString().split('T')[0];

    // 2. Extract Time (supports 9:30 pm, 9 y 30 pm, 9 y media, 9 y cuarto, 21:00, etc.)
    const timeRegex = /(?:(?:a las|cambies a las|cambia a las|pactada a las|para las|de las)\s*)?(\d{1,2}(?::\d{2}|\s*y\s*\d{1,2}|\s*y\s*media|\s*y\s*cuarto)?\s*(?:am|pm|hrs|horas|de la tarde|de la noche|de la mañana|a\s*m|p\s*m)?)/gi;
    const matches = Array.from(text.matchAll(timeRegex)).filter(m => m[1] && /\d/.test(m[1]));

    let targetTimeStr = '09:00 AM';

    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      let rawTime = lastMatch[1].toUpperCase().trim()
        .replace(/\s+/g, ' ')
        .replace(/A\s*M/g, 'AM')
        .replace(/P\s*M/g, 'PM');

      // Convert "9 Y 30" -> "9:30", "9 Y MEDIA" -> "9:30", "9 Y CUARTO" -> "9:15"
      rawTime = rawTime
        .replace(/(\d{1,2})\s*Y\s*MEDIA/i, '$1:30')
        .replace(/(\d{1,2})\s*Y\s*CUARTO/i, '$1:15')
        .replace(/(\d{1,2})\s*Y\s*(\d{1,2})/i, '$1:$2');

      const match = rawTime.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM|HRS|HORAS)?/i);
      if (match) {
        let hour = parseInt(match[1], 10);
        const min = match[2] ? match[2].padStart(2, '0') : '00';
        let ampm = match[3] ? match[3].toUpperCase() : '';

        if (ampm === 'HRS' || ampm === 'HORAS') ampm = '';

        if (!ampm) {
          if (rawTime.includes('TARDE') || rawTime.includes('NOCHE') || rawTime.includes('PM')) {
            ampm = 'PM';
          } else if (rawTime.includes('MAÑANA') || rawTime.includes('MANANA') || rawTime.includes('AM')) {
            ampm = 'AM';
          } else if (hour >= 1 && hour <= 7) {
            ampm = 'PM';
          } else if (hour >= 8 && hour <= 11) {
            ampm = 'AM';
          } else if (hour >= 12 && hour <= 23) {
            ampm = 'PM';
          } else {
            ampm = 'AM';
          }
        }

        if (ampm === 'PM' && hour > 12) hour -= 12;
        targetTimeStr = `${String(hour).padStart(2, '0')}:${min} ${ampm}`;
      }
    }

    // 3. Extract Dynamic Event Title (Non-Overfitting)
    let cleanTitle = text
      .replace(/\b(?:ayúdame|ayudame|por favor|quiero que|necesito que|puedes|podrías|podrias)\b/gi, '')
      .replace(/\b(?:quiero ir a|voy a ir a|vamos a ir a|tengo que ir a|quiero ir|voy a ir|tengo que|voy a|vamos a|quiero)\b/gi, '')
      .replace(/\b(?:agendar|agendando|agéndame|agendame|agendes|agende|agendarme|agenda|agendalo|agéndalo|a género|a genero|programa|programar|programando|prográmame|programame|programes|programe|anota|anótame|anotame|anotes|pon|poner|ponme|crea|crear|añade|añadir|añádeme|agrega|agregar|agrégame|cambia|cambiar|cambies|cambiame|mueve|mover|reprograma|reprogramar|reprogrames|pasa|pasar|posterga|postergar|modifica|modificar|modifiques|recuérdame|recuerdame|recuerdes|recuerde|recordar|recordarme|avísame|avisame|avises|avise|avisar|avisarme)\b\s*(?:una|un|el|la|los|las)?/gi, '')
      .replace(/\b(?:para\s*)?(?:hoy|mañana|manana|pasado mañana|pasado manana|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b/gi, '')
      .replace(/(?:el\s*)?\b\d{1,2}\s*(?:de|\/)\s*(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|\d{1,2})\b/gi, '')
      .replace(/(?:a las|para las|cambies a las|cambia a las|pactada a las|de las)?\s*\b\d{1,2}(?::\d{2}|\s*y\s*\d{1,2}|\s*y\s*media|\s*y\s*cuarto)?\s*(?:am|pm|hrs|horas|de la tarde|de la noche|de la mañana|a\s*m|p\s*m)?/gi, '')
      .replace(/\b(?:sobre|de|que se trata sobre|para)\b\s*/gi, '')
      .replace(/[.,:;]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Capitalize first letter
    if (cleanTitle.length > 0) {
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    } else {
      cleanTitle = 'Compromiso Agendado';
    }

    return {
      title: cleanTitle,
      time: targetTimeStr,
      targetDate,
      dateLabel
    };
  }
}
