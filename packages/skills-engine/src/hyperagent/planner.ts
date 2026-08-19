/**
 * TrautsLab OS — HyperPlanner
 * Strategic Agent: Decomposes complex goals into sequential, role-based subtasks.
 */

import { HyperPlan, HyperSubTask } from './types.js';

export class HyperPlanner {
  private ollamaEndpoint: string;
  private model: string;

  constructor(ollamaEndpoint = 'http://localhost:11434', model = 'qwen2.5:3b') {
    this.ollamaEndpoint = ollamaEndpoint;
    this.model = model;
  }

  async plan(goal: string): Promise<HyperPlan> {
    const timestamp = new Date().toISOString();
    
    try {
      const prompt = `Eres el HyperPlanner de TrautsLab OS. Descompón este objetivo complejo en 3 pasos ejecutables asignando cada uno a un rol (NAVIGATOR, EDITOR, EXECUTOR).
Objetivo: "${goal}"

Responde ÚNICAMENTE con un JSON válido con este formato:
{
  "tasks": [
    { "role": "NAVIGATOR", "title": "...", "instruction": "..." },
    { "role": "EDITOR", "title": "...", "instruction": "..." },
    { "role": "EXECUTOR", "title": "...", "instruction": "..." }
  ]
}`;

      const res = await fetch(`${this.ollamaEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          format: 'json'
        })
      });

      if (res.ok) {
        const data = await res.json() as { response: string };
        const parsed = JSON.parse(data.response) as { tasks: Array<{ role: 'NAVIGATOR' | 'EDITOR' | 'EXECUTOR'; title: string; instruction: string }> };
        if (parsed.tasks && Array.isArray(parsed.tasks) && parsed.tasks.length > 0) {
          const tasks: HyperSubTask[] = parsed.tasks.map((t, idx) => ({
            id: `task-step-${idx + 1}-${Date.now().toString(36)}`,
            stepNumber: idx + 1,
            role: t.role,
            title: t.title,
            instruction: t.instruction,
            status: 'PENDING'
          }));
          return { goal, createdAt: timestamp, tasks };
        }
      }
    } catch {
      // Fallback to deterministic heuristic decomposition if Ollama is slow/offline
    }

    // Heuristic fallback decomposition
    const fallbackTasks: HyperSubTask[] = [
      {
        id: `task-step-1-${Date.now().toString(36)}`,
        stepNumber: 1,
        role: 'NAVIGATOR',
        title: 'Exploración de Conocimiento en Vault',
        instruction: `Buscar notas y antecedentes relacionados con "${goal}" en el Obsidian Vault.`,
        status: 'PENDING'
      },
      {
        id: `task-step-2-${Date.now().toString(36)}`,
        stepNumber: 2,
        role: 'EDITOR',
        title: 'Síntesis y Redacción Estructurada',
        instruction: `Redactar reporte de investigación estructurado en Markdown con Frontmatter YAML para "${goal}".`,
        status: 'PENDING'
      },
      {
        id: `task-step-3-${Date.now().toString(36)}`,
        stepNumber: 3,
        role: 'EXECUTOR',
        title: 'Verificación e Indexación Jerárquica',
        instruction: `Validar sintaxis, reindexar el Vault con vault-sync-indexer y confirmar consistencia.`,
        status: 'PENDING'
      }
    ];

    return {
      goal,
      createdAt: timestamp,
      tasks: fallbackTasks
    };
  }
}
