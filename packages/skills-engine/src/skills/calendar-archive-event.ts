/**
 * TrautsLab OS — Calendar Archive Event Skill
 * Deterministically archives individual tasks or all tasks for the day in Obsidian Vault
 * moving them to an archived history section while preserving permanent knowledge records.
 */

import { Skill, SkillContext, SkillMetadata, SkillResult } from '../types.js';
import { Tier2CacheManager } from '@trautslab/vault-engine';
import fs from 'node:fs/promises';
import path from 'node:path';

export class CalendarArchiveEventSkill implements Skill {
  readonly metadata: SkillMetadata = {
    id: 'calendar-archive-event',
    name: 'Calendar Event Archiver',
    domain: 'productivity',
    tier: 1,
    description: 'Archiva una tarea específica o todos los compromisos del día en Obsidian Vault.'
  };

  async execute(ctx: SkillContext): Promise<SkillResult> {
    const start = Date.now();
    const query = (ctx.args?.query as string || ctx.args?.eventText as string || '').trim();
    const targetTitle = (ctx.args?.title as string || '').trim();
    const archiveAll = ctx.args?.archiveAll === true || /todos|toda la agenda|todo el d[ií]a|limpiar todo/i.test(query);

    const baseDate = ctx.timestamp ? new Date(ctx.timestamp) : new Date();
    const todayStr = baseDate.toISOString().split('T')[0];
    const targetDate = (ctx.args?.date as string || todayStr);

    const candidateVaults = [
      '/Users/jlorenzor/Documents/Obsidian Vault',
      path.resolve(process.cwd(), 'vault'),
      ctx.vaultRoot
    ].filter(Boolean);

    const realVaults = new Set<string>();
    for (const v of candidateVaults) {
      try {
        const real = await fs.realpath(v);
        realVaults.add(real);
      } catch {
        realVaults.add(v);
      }
    }
    const uniqueVaults = Array.from(realVaults);
    const createdArtifacts: string[] = [];
    let archivedCount = 0;
    let archivedItemName = '';

    for (const vaultPath of uniqueVaults) {
      try {
        const outputDir = path.join(vaultPath, 'OUTPUT');
        const agendaMdPath = path.join(outputDir, `daily-agenda-${targetDate}.md`);

        let currentMd = '';
        try {
          currentMd = await fs.readFile(agendaMdPath, 'utf-8');
        } catch {
          continue;
        }

        const lines = currentMd.split('\n');
        const activeRows: string[] = [];
        const archivedRows: string[] = [];
        let inTable = false;
        let inArchive = false;
        const otherSections: string[] = [];

        // Parse existing archived section if present
        let beforeTable: string[] = [];
        let afterTable: string[] = [];
        let state: 'before_table' | 'in_table' | 'after_table' = 'before_table';

        for (const line of lines) {
          if (line.includes('| Hora | Actividad')) {
            state = 'in_table';
            beforeTable.push(line);
            continue;
          }
          if (state === 'in_table' && line.includes('| :---')) {
            beforeTable.push(line);
            continue;
          }
          if (state === 'in_table') {
            if (line.trim().startsWith('|')) {
              const cols = line.split('|').map(c => c.trim()).filter(Boolean);
              if (cols.length >= 2) {
                const rowTime = cols[0].replace(/[`*]/g, '').trim();
                const rowTitle = cols[1].replace(/[`*]/g, '').trim();
                const normRowTitle = rowTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const normQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const normTarget = targetTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                const queryWords = normQuery
                  .replace(/\b(?:archivar|archiva|archíva|archivame|archivalo|archivala|completar|completa|marca como|marcar como|dar por concluida|la|el|una|un|tarea|actividad|compromiso|hoy|manana|mañana)\b/gi, '')
                  .trim()
                  .split(/\s+/)
                  .filter(w => w.length >= 3);

                const matches = archiveAll || 
                  (normTarget && (normRowTitle.includes(normTarget) || normTarget.includes(normRowTitle))) ||
                  (queryWords.length > 0 && queryWords.some(w => normRowTitle.includes(w))) ||
                  (normQuery && (normQuery.includes(normRowTitle) || normRowTitle.includes(normQuery)));

                if (matches) {
                  archivedCount++;
                  archivedItemName = rowTitle;
                  archivedRows.push(`| \`${rowTime}\` | ~~**${rowTitle}**~~ | N/A | \`ARCHIVADO\` | 🟢 Archivado |`);
                } else {
                  activeRows.push(line);
                }
              }
            } else {
              state = 'after_table';
              afterTable.push(line);
            }
          } else if (state === 'before_table') {
            beforeTable.push(line);
          } else {
            afterTable.push(line);
          }
        }

        // Build updated Markdown with ## 📦 Archivo de Compromisos section
        let newContent = beforeTable.join('\n') + '\n';
        if (activeRows.length > 0) {
          newContent += activeRows.join('\n') + '\n';
        }

        // Ensure notes and archive section
        let afterText = afterTable.join('\n');
        const archiveSectionHeader = '## 📦 Archivo de Compromisos e Historial';

        if (archivedRows.length > 0) {
          if (!afterText.includes(archiveSectionHeader)) {
            afterText += `\n---\n\n${archiveSectionHeader}\n\n| Hora | Actividad Archivada | Ubicación | Estado |\n| :--- | :--- | :--- | :--- |\n`;
          }
          const archiveTableMarker = '| :--- | :--- | :--- | :--- |\n';
          const archiveRowsStr = archivedRows.map(r => {
            const cols = r.split('|').map(c => c.trim()).filter(Boolean);
            return `| ${cols[0]} | ${cols[1]} | ${cols[2] || 'N/A'} | 🟢 Archivado |`;
          }).join('\n') + '\n';

          if (afterText.includes(archiveTableMarker)) {
            afterText = afterText.replace(archiveTableMarker, `${archiveTableMarker}${archiveRowsStr}`);
          } else {
            afterText += `${archiveRowsStr}`;
          }
        }

        newContent += afterText;
        await fs.writeFile(agendaMdPath, newContent, 'utf-8');
        createdArtifacts.push(agendaMdPath);

        // Update Tier 2 Cache
        if (targetDate === todayStr) {
          const cacheMgr = new Tier2CacheManager(vaultPath);
          const remainingEvents = activeRows.map(r => {
            const cols = r.split('|').map(c => c.trim()).filter(Boolean);
            return {
              time: cols[0]?.replace(/[`*]/g, '').trim() || '',
              title: cols[1]?.replace(/[`*]/g, '').trim() || '',
              priority: 'high',
              status: 'scheduled'
            };
          });

          await cacheMgr.setCache('today-agenda', {
            schema_version: '1.0',
            category: 'daily_agenda',
            generated_at: new Date().toISOString(),
            expires_at: `${todayStr}T23:59:59Z`,
            quick_summary_tts: remainingEvents.length === 0 
              ? 'Todas las actividades han sido archivadas con éxito.' 
              : `Has archivado compromisos. Te quedan ${remainingEvents.length} actividades activas hoy.`,
            data: {
              eventsCount: remainingEvents.length,
              events: remainingEvents
            }
          });
        }
      } catch (err) {
        console.warn(`[CalendarArchiveEventSkill] Warning in ${vaultPath}:`, err);
      }
    }

    const summaryMsg = archiveAll 
      ? `✓ Se han archivado todas las actividades del día (${archivedCount} registros guardados en tu historial de Obsidian).`
      : `✓ He archivado '${archivedItemName || 'la actividad'}' en tu historial de Obsidian.`;

    return {
      success: true,
      skillId: this.metadata.id,
      executionTimeMs: Date.now() - start,
      message: summaryMsg,
      artifactsCreated: createdArtifacts,
      cacheKeysUpdated: ['today-agenda']
    };
  }
}
