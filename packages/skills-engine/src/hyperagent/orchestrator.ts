/**
 * TrautsLab OS — HyperOrchestrator
 * Central Orchestrator: Coordinates the 4-Role HyperAgent Quad (Planner, Navigator, Editor, Executor).
 */

import { HyperPlanner } from './planner.js';
import { HyperNavigator } from './navigator.js';
import { HyperEditor } from './editor.js';
import { HyperExecutor } from './executor.js';
import { HyperPlan, HyperOrchestrationResult } from './types.js';

export type ProgressCallback = (event: {
  type: 'PLAN_CREATED' | 'STEP_STARTED' | 'STEP_COMPLETED' | 'TASK_FINISHED';
  step?: number;
  role?: string;
  message: string;
  timestamp: string;
}) => void;

export class HyperOrchestrator {
  private planner: HyperPlanner;
  private navigator: HyperNavigator;
  private editor: HyperEditor;
  private executor: HyperExecutor;

  constructor(vaultPath = '/Users/jlorenzor/Documents/Obsidian Vault') {
    this.planner = new HyperPlanner();
    this.navigator = new HyperNavigator(vaultPath);
    this.editor = new HyperEditor(vaultPath);
    this.executor = new HyperExecutor(vaultPath);
  }

  async runTask(goal: string, onProgress?: ProgressCallback): Promise<HyperOrchestrationResult> {
    const startTime = Date.now();
    const taskId = `hyper-task-${Date.now().toString(36)}`;
    const artifactsCreated: string[] = [];

    // Step 1: Planning
    const plan: HyperPlan = await this.planner.plan(goal);
    if (onProgress) {
      onProgress({
        type: 'PLAN_CREATED',
        message: `HyperPlanner descompuso el objetivo en ${plan.tasks.length} pasos estratégicos.`,
        timestamp: new Date().toISOString()
      });
    }

    let accumulatedContext = '';
    let targetFilePath = '';

    // Step 2: Execute Plan Steps Sequentially
    for (const task of plan.tasks) {
      task.status = 'IN_PROGRESS';
      if (onProgress) {
        onProgress({
          type: 'STEP_STARTED',
          step: task.stepNumber,
          role: task.role,
          message: `Iniciando paso ${task.stepNumber} [${task.role}]: ${task.title}`,
          timestamp: new Date().toISOString()
        });
      }

      if (task.role === 'NAVIGATOR') {
        const navResult = await this.navigator.navigate(goal);
        accumulatedContext = navResult.contextSummary;
        task.status = 'SUCCESS';
        task.result = `Contexto recopilado (${navResult.matchedFiles.length} notas analizadas).`;
      } else if (task.role === 'EDITOR') {
        const safeSlug = goal
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 40)
          .replace(/^-|-$/g, '');
        const fileName = `${safeSlug}.md`;
        const editResult = await this.editor.editMarkdown(
          'ai-systems',
          fileName,
          `Reporte de Investigación: ${goal}`,
          goal,
          accumulatedContext
        );
        targetFilePath = editResult.filePath;
        artifactsCreated.push(targetFilePath);
        task.status = 'SUCCESS';
        task.result = `Archivo redactado: ${editResult.filePath} (${editResult.bytesWritten} bytes).`;
      } else if (task.role === 'EXECUTOR') {
        const execResult = await this.executor.executeSubTask(task, targetFilePath);
        if (execResult.success) {
          task.status = 'SUCCESS';
          task.result = execResult.message;
          if (execResult.artifacts) {
            artifactsCreated.push(...execResult.artifacts);
          }
        } else {
          task.status = 'FAILED';
          task.error = execResult.message;
        }
      }

      if (onProgress) {
        onProgress({
          type: 'STEP_COMPLETED',
          step: task.stepNumber,
          role: task.role,
          message: `Paso ${task.stepNumber} [${task.role}] completado: ${task.result || task.error}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    const totalTimeMs = Date.now() - startTime;
    const allSuccessful = plan.tasks.every((t) => t.status === 'SUCCESS');
    const finalSummary = allSuccessful
      ? `✓ Tarea completada con éxito en ${totalTimeMs}ms por la cuadrilla HyperAgent. Reporte disponible en el Vault.`
      : `⚠️ Tarea finalizada con advertencias en ${totalTimeMs}ms.`;

    if (onProgress) {
      onProgress({
        type: 'TASK_FINISHED',
        message: finalSummary,
        timestamp: new Date().toISOString()
      });
    }

    return {
      taskId,
      goal,
      success: allSuccessful,
      totalTimeMs,
      plan,
      finalSummary,
      artifactsCreated: Array.from(new Set(artifactsCreated))
    };
  }
}
