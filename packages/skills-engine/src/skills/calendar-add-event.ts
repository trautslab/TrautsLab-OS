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
    const vaultRoot = ctx.vaultRoot || path.resolve(process.cwd(), 'vault');
    const query = (ctx.args?.eventText as string || ctx.args?.query as string || 'Cena de hoy 8:00 PM').trim();

    // 1. Extract Event Title and Time
    const parsed = this.extractEventDetails(query);
    const todayStr = (ctx.timestamp || new Date()).toISOString().split('T')[0];

    const outputDir = path.join(vaultRoot, 'OUTPUT');
    const agendaMdPath = path.join(outputDir, `daily-agenda-${todayStr}.md`);

    await fs.mkdir(outputDir, { recursive: true });

    // 2. Read or initialize daily agenda markdown
    let currentMd = '';
    try {
      currentMd = await fs.readFile(agendaMdPath, 'utf-8');
    } catch {
      currentMd = `# Agenda Diaria y Cronograma — ${todayStr}\n\n| Hora | Compromiso / Evento | Estado |\n| :--- | :--- | :--- |\n`;
    }

    // Append event row
    const newRow = `| **${parsed.time}** | ${parsed.title} | 🟡 Programado |\n`;
    currentMd += newRow;
    await fs.writeFile(agendaMdPath, currentMd, 'utf-8');

    // 3. Update Tier 2 Cache (OUTPUT/cache/today-agenda.json)
    const cacheMgr = new Tier2CacheManager(vaultRoot);
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

    return {
      success: true,
      skillId: this.metadata.id,
      executionTimeMs: Date.now() - start,
      message: `✓ Evento añadido con éxito: "${parsed.title}" a las ${parsed.time}. ${quickSummary}`,
      artifactsCreated: [agendaMdPath],
      cacheKeysUpdated: ['today-agenda']
    };
  }

  private extractEventDetails(raw: string): { title: string; time: string } {
    let clean = raw
      .replace(/^(ayúdame\s*a\s*agendar|ayúdame\s*agendando|ayúdame\s*con\s*la|ayúdame\s*con|por\s*favor\s*agenda|por\s*favor|puedes\s*agendar|quiero\s*agendar|necesito\s*agendar|agendando|agenda|agendar|añade\s*a\s*la\s*agenda|agrega\s*a\s*la\s*agenda|añade|agrega|crea|programar)\s*(a|un|una|la|el)?/i, '')
      .replace(/^(a la agenda|en mi calendario|en la agenda)\s*/i, '')
      .trim();

    // Try to extract time pattern (e.g., "a las 8:00 PM", "8pm", "20:00", "a las 8", "8:00 pm", "20:30")
    let time = '08:00 PM';
    const timeMatch = clean.match(/(?:a las\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm|hrs|horas)?)/i);

    if (timeMatch && timeMatch[0]) {
      time = timeMatch[1].toUpperCase().trim();
      clean = clean.replace(timeMatch[0], '').replace(/\s+a las\s*$/i, '').trim();
    }

    let title = clean.charAt(0).toUpperCase() + clean.slice(1);
    if (!title || title.length < 2) title = 'Cena de hoy';

    return { title, time };
  }
}
