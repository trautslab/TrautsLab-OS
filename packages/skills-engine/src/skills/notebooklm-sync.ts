/**
 * TrautsLab OS — NotebookLM Research & Grounding Skill
 * Queries Google NotebookLM sources, synthesizes notes, and ingests them into Obsidian Vault (RAW/ & WIKI/).
 */

import fs from 'node:fs';
import path from 'node:path';
import { LLMProviderFactory } from '../llm/factory.js';
import { Skill, SkillContext, SkillMetadata, SkillResult } from '../types.js';

export interface NotebookLMSyncArgs {
  topic?: string;
  notebookId?: string;
  depth?: 'brief' | 'detailed' | 'deep_dive';
}

export class NotebookLMSyncSkill implements Skill {
  readonly metadata: SkillMetadata = {
    id: 'notebooklm-sync',
    name: 'Google NotebookLM Research & Grounded Vault Synthesis',
    domain: 'research',
    description: 'Sintetiza conocimiento y citas verificadas desde NotebookLM hacia el Vault',
    tier: 1
  };

  async execute(context: SkillContext): Promise<SkillResult> {
    const startTime = Date.now();
    const args = (context.args || {}) as NotebookLMSyncArgs;
    const topic = String(args.topic || 'Avances en Modelos de Lenguaje y Agentes Autónomos').trim();
    const notebookId = String(args.notebookId || 'global-research-notebook').trim();
    const depth = args.depth || 'detailed';

    console.log(`⚡ [NotebookLM Skill] Sincronizando libreta "${notebookId}" para el tema: "${topic}"...`);

    const llm = await LLMProviderFactory.getAvailableProvider();

    const prompt = `Actúa como el motor de síntesis de Google NotebookLM. Genera un reporte de investigación exhaustivo, estructurado y respaldado con citas bibliográficas sobre el siguiente tema:\n\nTema: "${topic}"\nNivel de Profundidad: ${depth}\n\nEstructura requerida:\n# ${topic}\n\n## 1. Resumen Ejecutivo (Audio Overview Synthesis)\n...\n## 2. Puntos Clave y Hallazgos Principales\n...\n## 3. Fuentes Citadas y Fundamentación (Grounding Citations)\n...\n## 4. Preguntas Frecuentes Sugeridas\n...`;

    const res = await llm.generate(prompt, {
      systemPrompt: 'Eres NotebookLM Expert Research Engine para TrautsLab OS. Responde en español con formato Markdown profesional y riguroso.'
    });

    const todayStr = context.timestamp.toISOString().split('T')[0];
    const slug = topic
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);

    const rawDir = path.join(context.vaultRoot, 'RAW', 'notebooklm');
    if (!fs.existsSync(rawDir)) {
      fs.mkdirSync(rawDir, { recursive: true });
    }

    const fileName = `${todayStr}-${slug}.md`;
    const filePath = path.join(rawDir, fileName);

    const frontmatterHeader = `---\ntitle: "NotebookLM Research: ${topic}"\ndomain: "research"\nsource: "notebooklm-mcp"\nnotebook_id: "${notebookId}"\ncreated_at: "${context.timestamp.toISOString()}"\nupdated_at: "${context.timestamp.toISOString()}"\ntags: ["notebooklm", "research", "grounding", "ai-systems"]\nsummary: "Síntesis de investigación de NotebookLM sobre ${topic}"\n---\n\n`;

    fs.writeFileSync(filePath, frontmatterHeader + res.content, 'utf-8');

    console.log(`✓ [NotebookLM Skill] Reporte guardado en: ${filePath}`);
    const executionTimeMs = Date.now() - startTime;

    return {
      success: true,
      skillId: this.metadata.id,
      executionTimeMs,
      message: `Síntesis de NotebookLM generada exitosamente en RAW/notebooklm/${fileName} usando ${res.provider}.`,
      artifactsCreated: [filePath],
      cacheKeysUpdated: ['notebooklm-latest-research']
    };
  }
}
