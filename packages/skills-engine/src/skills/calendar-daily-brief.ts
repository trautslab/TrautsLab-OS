import fs from 'node:fs/promises';
import path from 'node:path';
import { Tier2CacheManager } from '@trautslab/vault-engine';
import { Skill, SkillContext, SkillMetadata, SkillResult } from '../types.js';

interface CalendarEvent {
  time: string;
  title: string;
  location?: string;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'completed';
}

export class CalendarDailyBriefSkill implements Skill {
  metadata: SkillMetadata = {
    id: 'calendar-daily-brief',
    name: 'Calendar Daily Brief & Timeline',
    domain: 'productivity',
    description: 'Genera el briefing diario de compromisos de agenda, formateando el entregable en OUTPUT/ y actualizando la caché Tier 2 para consultas de voz.',
    cronSchedule: '30 7 * * *', // 07:30 AM diario
    tier: 1
  };

  async execute(ctx: SkillContext): Promise<SkillResult> {
    const todayStr = ctx.timestamp.toISOString().split('T')[0];
    const outputDir = path.join(ctx.vaultRoot, 'OUTPUT');
    await fs.mkdir(outputDir, { recursive: true });

    // Events (can be linked to Google Calendar / local iCal / JSON store)
    const events: CalendarEvent[] = [
      {
        time: '09:00 AM',
        title: 'Morning Intel Scan & Sync',
        priority: 'normal',
        status: 'completed'
      },
      {
        time: '11:00 AM',
        title: 'Revisión de Arquitectura TrautsLab OS',
        location: 'Sala de Reuniones',
        priority: 'high',
        status: 'pending'
      },
      {
        time: '03:30 PM',
        title: 'Grabación Demo: Asistente de Voz y Skills',
        location: 'Estudio Local',
        priority: 'high',
        status: 'pending'
      }
    ];

    const mainEvent = events.find(e => e.priority === 'high' && e.status === 'pending') || events[0];

    // 1. Write Markdown Deliverable in OUTPUT/
    const markdownContent = `---
title: "Agenda y Compromisos Diarios: ${todayStr}"
domain: "productivity"
created_at: "${todayStr}"
updated_at: "${todayStr}"
tags: ["agenda", "calendar", "daily-brief", "tasks"]
summary: "Compromiso principal hoy: '${mainEvent.title}' a las ${mainEvent.time} con un total de ${events.length} eventos programados."
---

# Agenda y Compromisos Diarios — ${todayStr}

> **Generado:** ${ctx.timestamp.toISOString()}  
> **Compromiso Principal:** **${mainEvent.title}** a las ${mainEvent.time} (${mainEvent.location || 'Online'})  

---

## 🕒 Cronograma del Día

| Hora | Actividad / Compromiso | Ubicación | Prioridad | Estado |
| :--- | :--- | :--- | :--- | :--- |
${events.map(e => `| \`${e.time}\` | **${e.title}** | ${e.location || 'N/A'} | \`${e.priority.toUpperCase()}\` | ${e.status === 'completed' ? '✅ Completado' : '⏳ Pendiente'} |`).join('\n')}

---

## 🎯 Recomendaciones de Foco
1. Mantener bloque de foco ininterrumpido antes de la reunión de las **${mainEvent.time}**.
2. Verificar batería y micrófonos para la sesión de las **03:30 PM**.
`;

    const deliverablePath = path.join(outputDir, `daily-agenda-${todayStr}.md`);
    await fs.writeFile(deliverablePath, markdownContent, 'utf-8');

    // 2. Update Tier 2 Fast Cache for Kokoro TTS Voice (<30 words)
    const cacheMgr = new Tier2CacheManager(ctx.vaultRoot);
    const ttsSnippet = `Tu compromiso principal hoy es ${mainEvent.title} a las ${mainEvent.time}, seguido por la grabación del demo a las tres y media de la tarde.`;

    await cacheMgr.setCache('today-agenda', {
      schema_version: '1.0',
      category: 'daily_agenda',
      generated_at: ctx.timestamp.toISOString(),
      expires_at: `${todayStr}T23:59:59Z`,
      quick_summary_tts: ttsSnippet,
      data: {
        eventsCount: events.length,
        mainCommitment: mainEvent,
        events
      }
    });

    return {
      success: true,
      skillId: this.metadata.id,
      executionTimeMs: 0,
      message: `Briefing de agenda para ${todayStr} generado exitosamente.`,
      artifactsCreated: [deliverablePath],
      cacheKeysUpdated: ['today-agenda']
    };
  }
}
