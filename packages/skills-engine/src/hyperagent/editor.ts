/**
 * TrautsLab OS — HyperEditor
 * Editing Agent: Produces and applies structured Markdown and code patches cleanly.
 */

import fs from 'node:fs';
import path from 'node:path';
import { HyperEditorResult } from './types.js';

export class HyperEditor {
  private vaultPath: string;
  private ollamaEndpoint: string;
  private model: string;

  constructor(
    vaultPath = '/Users/jlorenzor/Documents/Obsidian Vault',
    ollamaEndpoint = 'http://localhost:11434',
    model = 'qwen2.5:3b'
  ) {
    this.vaultPath = vaultPath;
    this.ollamaEndpoint = ollamaEndpoint;
    this.model = model;
  }

  async editMarkdown(
    targetCategory: 'ai-systems' | 'productivity' | 'development' | 'operations' | 'reports',
    fileName: string,
    title: string,
    topic: string,
    contextSummary: string
  ): Promise<HyperEditorResult> {
    const today = new Date().toISOString().split('T')[0];
    const safeName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    
    let targetDir = path.join(this.vaultPath, 'WIKI', targetCategory);
    if (targetCategory === 'reports') {
      targetDir = path.join(this.vaultPath, 'OUTPUT', 'reports');
    }
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, safeName);

    // Generate structured markdown synthesis
    let content = '';
    try {
      const prompt = `Eres el HyperEditor de TrautsLab OS. Genera un artículo técnico estructurado en Markdown para la WIKI de Obsidian.
Título: "${title}"
Tema: "${topic}"
Contexto Previsto: "${contextSummary}"
Fecha: "${today}"

Requisitos:
1. Encabezado Frontmatter YAML estricto con title, domain, created_at, updated_at, tags (array), summary.
2. Contenido técnico claro con subtítulos, listas y diagrama Mermaid si aplica.
3. Terminar con enlace de navegación.`;

      const res = await fetch(`${this.ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false
        })
      });

      if (res.ok) {
        const data = await res.json() as { response: string };
        content = data.response;
      }
    } catch {
      // Fallback template
    }

    if (!content || !content.startsWith('---')) {
      content = `---
title: "${title}"
domain: "${targetCategory}"
created_at: "${today}"
updated_at: "${today}"
tags: ["hyperagent", "research", "${targetCategory}"]
summary: "Reporte estructurado generado autónomamente por la cuadrilla HyperAgent sobre ${topic}."
---

# ${title}

> **Generado por:** HyperAgent Autonomous Quad (Tier 3)  
> **Fecha:** ${today}  
> **Estándar Horario:** PET / UTC-5 - Hora Perú

---

## 📌 Resumen Ejecutivo
${topic}

## 🔍 Contexto y Antecedentes
${contextSummary}

## 🚀 Conclusiones y Próximos Pasos
- Investigación consolidada en el Obsidian Vault.
- Índices actualizados automáticamente.
`;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    const bytesWritten = Buffer.byteLength(content, 'utf-8');

    return {
      filePath,
      action: 'CREATE',
      contentSnippet: content.slice(0, 200),
      bytesWritten
    };
  }
}
