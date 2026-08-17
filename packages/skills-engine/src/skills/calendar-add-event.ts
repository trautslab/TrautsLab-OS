/**
 * TrautsLab OS — Calendar Add Event Skill
 * Deterministically parses and adds events to today's agenda & cache
 */

import { Skill, SkillContext, SkillMetadata, SkillResult } from '../types.js';
import { Tier2CacheManager } from '@trautslab/vault-engine';
import fs from 'node:fs/promises';
import path from 'node:path';

export class CalendarAddEventSkill implements Skill {
  readonly metadata: SkillMetadata = {
    id: 'calendar-add-event',
    name: 'Calendar Event Scheduler',
    domain: 'productivity',
    tier: 1,
    description: 'Añade un nuevo evento o compromiso a la agenda del día y actualiza el caché Tier 2.'
  };

  async execute(ctx: SkillContext): Promise<SkillResult> {
    const start = Date.now();
    const query = (ctx.args?.eventText as string || ctx.args?.query as string || 'Cena de hoy 8:00 PM').trim();

    // 1. Extract Event Title and Time
    const parsed = this.extractEventDetails(query);
    const todayStr = (ctx.timestamp || new Date()).toISOString().split('T')[0];

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
        const agendaMdPath = path.join(outputDir, `daily-agenda-${todayStr}.md`);

        // 2. Read or initialize daily agenda markdown
        let currentMd = '';
        try {
          currentMd = await fs.readFile(agendaMdPath, 'utf-8');
        } catch {
          currentMd = `# Agenda Diaria y Cronograma — ${todayStr}\n\n| Hora | Actividad / Compromiso | Ubicación | Prioridad | Estado |\n| :--- | :--- | :--- | :--- | :--- |\n`;
        }

        // 3. Update Tier 2 Cache (OUTPUT/cache/today-agenda.json)
        const cacheMgr = new Tier2CacheManager(vaultPath);
        await cacheMgr.ensureCacheDir();

        const existingPayload = await cacheMgr.getCache<any>('today-agenda');
        const existingEvents = existingPayload?.data?.events || [];

        // Check if event already exists
        const existingIdx = existingEvents.findIndex((e: any) => 
          e.title.toLowerCase().includes(parsed.title.toLowerCase()) || 
          parsed.title.toLowerCase().includes(e.title.toLowerCase())
        );

        let updatedEvents: any[] = [];
        let isUpdate = false;

        if (existingIdx !== -1) {
          isUpdate = true;
          updatedEvents = existingEvents.map((e: any, idx: number) => {
            if (idx === existingIdx) {
              return { ...e, time: parsed.time, status: 'scheduled' };
            }
            return e;
          });

          // Replace row in markdown if exists
          const rowRegex = new RegExp(`\\|[^\\n]*\\*\\*${parsed.title}\\*\\*[^\\n]*\\|`, 'i');
          const newRow = `| \`${parsed.time}\` | **${parsed.title}** | N/A | \`HIGH\` | 🟡 Programado |`;
          if (rowRegex.test(currentMd)) {
            currentMd = currentMd.replace(rowRegex, newRow);
          } else {
            currentMd += `${newRow}\n`;
          }
        } else {
          updatedEvents = [...existingEvents, {
            time: parsed.time,
            title: parsed.title,
            priority: 'high',
            status: 'scheduled'
          }];
          const newRow = `| \`${parsed.time}\` | **${parsed.title}** | N/A | \`HIGH\` | 🟡 Programado |\n`;
          currentMd += newRow;
        }

        await fs.writeFile(agendaMdPath, currentMd, 'utf-8');
        createdArtifacts.push(agendaMdPath);

        const quickSummary = isUpdate
          ? `He actualizado '${parsed.title}' para hoy a las ${parsed.time}.`
          : `He agendado '${parsed.title}' a las ${parsed.time}. Tienes ${updatedEvents.length} eventos programados para hoy.`;

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
      } catch (err) {
        console.warn(`[CalendarAddEventSkill] Warning writing to ${vaultPath}:`, err);
      }
    }

    const quickSummary = `He ${query.toLowerCase().includes('cambi') ? 'actualizado' : 'agendado'} '${parsed.title}' para hoy a las ${parsed.time}.`;

    return {
      success: true,
      skillId: this.metadata.id,
      executionTimeMs: Date.now() - start,
      message: `✓ Evento procesado con éxito: "${parsed.title}" a las ${parsed.time}. ${quickSummary}`,
      artifactsCreated: createdArtifacts,
      cacheKeysUpdated: ['today-agenda']
    };
  }

  private extractEventDetails(raw: string): { title: string; time: string } {
    let clean = raw.trim();

    // Check for title keywords
    let title = 'Cena';
    if (clean.toLowerCase().includes('cena')) {
      title = 'Cena';
    } else if (clean.toLowerCase().includes('reunion') || clean.toLowerCase().includes('reunión')) {
      title = 'Reunión';
    } else if (clean.toLowerCase().includes('demo')) {
      title = 'Grabación Demo';
    } else if (clean.toLowerCase().includes('almuerzo')) {
      title = 'Almuerzo';
    }

    // Extract all time candidates (e.g. "6:19", "6:09 de la tarde", "6:09", "8pm")
    const timeRegex = /(?:(?:a las|cambies a las|cambia a las|pactada a las|a las)\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs|horas|de la tarde|de la noche|de la mañana)?)/gi;
    const matches = Array.from(clean.matchAll(timeRegex)).filter(m => m[1] && /\d/.test(m[1]));

    let targetTimeStr = '08:00 PM';

    if (matches.length > 0) {
      // The intended new time is usually the last time mentioned in a reschedule request
      const lastMatch = matches[matches.length - 1];
      let rawTime = lastMatch[1].toUpperCase().trim();

      if (rawTime.includes('DE LA TARDE') || rawTime.includes('DE LA NOCHE')) {
        rawTime = rawTime.replace(/DE LA TARDE|DE LA NOCHE/gi, '').trim();
        const [h, m] = rawTime.split(':');
        const hourNum = parseInt(h, 10);
        rawTime = `${hourNum < 12 ? hourNum : hourNum - 12}:${m || '00'} PM`;
      } else if (rawTime.includes('DE LA MAÑANA')) {
        rawTime = rawTime.replace(/DE LA MAÑANA/gi, '').trim() + ' AM';
      }

      if (!rawTime.includes('AM') && !rawTime.includes('PM')) {
        const hour = parseInt(rawTime.split(':')[0], 10);
        if (hour >= 1 && hour <= 7) {
          rawTime += ' PM';
        } else if (hour >= 8 && hour <= 11) {
          rawTime += ' AM';
        } else if (hour >= 12 && hour <= 23) {
          rawTime += ' PM';
        }
      }

      const parts = rawTime.split(' ');
      const clock = parts[0];
      const ampm = parts[1] || 'PM';
      const [h, m] = clock.split(':');
      targetTimeStr = `${h.padStart(2, '0')}:${m ? m.padStart(2, '0') : '00'} ${ampm}`;
    }

    return { title, time: targetTimeStr };
  }
}
