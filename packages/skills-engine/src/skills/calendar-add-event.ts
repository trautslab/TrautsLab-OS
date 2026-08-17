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
          currentMd = `# Agenda Diaria y Cronograma — ${todayStr}\n\n| Hora | Compromiso / Evento | Estado |\n| :--- | :--- | :--- |\n`;
        }

        // Append event row
        const newRow = `| \`${parsed.time}\` | **${parsed.title}** | 🟡 Programado |\n`;
        currentMd += newRow;
        await fs.writeFile(agendaMdPath, currentMd, 'utf-8');
        createdArtifacts.push(agendaMdPath);

        // 3. Update Tier 2 Cache (OUTPUT/cache/today-agenda.json)
        const cacheMgr = new Tier2CacheManager(vaultPath);
        await cacheMgr.ensureCacheDir();

        const existingPayload = await cacheMgr.getCache<any>('today-agenda');
        const existingEvents = existingPayload?.data?.events || [];

        const updatedEvents = [...existingEvents, {
          time: parsed.time,
          title: parsed.title,
          status: 'scheduled'
        }];

        const quickSummary = `He agendado '${parsed.title}' a las ${parsed.time}. Tienes ${updatedEvents.length} eventos programados para hoy.`;

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

    const quickSummary = `He agendado '${parsed.title}' a las ${parsed.time}.`;

    return {
      success: true,
      skillId: this.metadata.id,
      executionTimeMs: Date.now() - start,
      message: `✓ Evento añadido con éxito: "${parsed.title}" a las ${parsed.time}. ${quickSummary}`,
      artifactsCreated: createdArtifacts,
      cacheKeysUpdated: ['today-agenda']
    };
  }

  private extractEventDetails(raw: string): { title: string; time: string } {
    let clean = raw
      .replace(/^(ayúdame\s*a\s*agendar|ayúdame\s*agendando|ayúdame\s*con\s*la|ayúdame\s*con|por\s*favor\s*agenda|por\s*favor|puedes\s*agendar|quiero\s*agendar|necesito\s*agendar|agendando|agenda|agendar|añade\s*a\s*la\s*agenda|agrega\s*a\s*la\s*agenda|añade|agrega|crea|programar)\s*(a|un|una|la|el)?/i, '')
      .replace(/^(a la agenda|en mi calendario|en la agenda)\s*/i, '')
      .trim();

    // Try to extract time pattern (e.g., "6:19 pm", "6:19", "a las 6:19 pm", "18:19", "8pm", "20:00")
    let time = '08:00 PM';
    const timeMatch = clean.match(/(?:a las\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs|horas|de la tarde|de la noche|de la mañana)?)/i);

    if (timeMatch && timeMatch[0]) {
      let rawTime = timeMatch[1].toUpperCase().trim();
      
      // Normalize Spanish time suffixes
      if (rawTime.includes('DE LA TARDE') || rawTime.includes('DE LA NOCHE')) {
        rawTime = rawTime.replace(/DE LA TARDE|DE LA NOCHE/gi, '').trim();
        const [h, m] = rawTime.split(':');
        const hourNum = parseInt(h, 10);
        rawTime = `${hourNum < 12 ? hourNum : hourNum - 12}:${m || '00'} PM`;
      } else if (rawTime.includes('DE LA MAÑANA')) {
        rawTime = rawTime.replace(/DE LA MAÑANA/gi, '').trim() + ' AM';
      }

      // Add PM/AM if simple numbers without indicator
      if (!rawTime.includes('AM') && !rawTime.includes('PM')) {
        const hour = parseInt(rawTime.split(':')[0], 10);
        if (hour >= 1 && hour <= 7) {
          rawTime += ' PM'; // Default afternoon/evening
        } else if (hour >= 8 && hour <= 11) {
          rawTime += ' AM';
        } else if (hour >= 12 && hour <= 23) {
          rawTime += ' PM';
        }
      }

      // Ensure 2-digit hour (e.g., "06:19 PM")
      const parts = rawTime.split(' ');
      const clock = parts[0];
      const ampm = parts[1] || 'PM';
      const [h, m] = clock.split(':');
      time = `${h.padStart(2, '0')}:${m ? m.padStart(2, '0') : '00'} ${ampm}`;

      clean = clean.replace(timeMatch[0], '').replace(/\s+a las\s*$/i, '').trim();
    }

    // Clean up residual words from title
    let title = clean
      .replace(/\b(para hoy|de hoy|hoy|esta noche|esta tarde)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    title = title.charAt(0).toUpperCase() + title.slice(1);
    if (!title || title.length < 2) title = 'Cena';

    return { title, time };
  }
}
