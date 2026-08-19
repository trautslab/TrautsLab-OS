/**
 * TrautsLab OS — HyperAgent Automated Test Suite
 * Tests the 4-Role Quad (Planner, Navigator, Editor, Executor) and Full Orchestration.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  HyperPlanner,
  HyperNavigator,
  HyperEditor,
  HyperExecutor,
  HyperOrchestrator
} from '../src/hyperagent/index.js';

describe('HyperAgent Multi-Role Autonomous Engine', () => {
  it('1. HyperPlanner descompone objetivos complejos en sub-tareas estructuradas', async () => {
    const planner = new HyperPlanner();
    const plan = await planner.plan('Investigar modelos de voz locales y generar reporte');
    
    assert.ok(plan.tasks.length >= 3, 'Debe generar al menos 3 pasos');
    assert.equal(plan.tasks[0].role, 'NAVIGATOR', 'Paso 1 debe ser NAVIGATOR');
    assert.equal(plan.tasks[1].role, 'EDITOR', 'Paso 2 debe ser EDITOR');
    assert.equal(plan.tasks[2].role, 'EXECUTOR', 'Paso 3 debe ser EXECUTOR');
    console.log(`  ✓ HyperPlanner generó plan con ${plan.tasks.length} pasos para: "${plan.goal}"`);
  });

  it('2. HyperNavigator consulta el Vault mediante búsqueda híbrida', async () => {
    const navigator = new HyperNavigator();
    const result = await navigator.navigate('modelos de voz Metal GPU');
    
    assert.ok(typeof result.contextSummary === 'string', 'Debe retornar un resumen de contexto');
    assert.ok(Array.isArray(result.matchedFiles), 'Debe retornar array de archivos coincidentes');
    console.log(`  ✓ HyperNavigator localizó ${result.matchedFiles.length} referencias contextuales`);
  });

  it('3. HyperEditor redacta artículos Markdown conformes a Frontmatter YAML', async () => {
    const editor = new HyperEditor();
    const result = await editor.editMarkdown(
      'ai-systems',
      'test-hyperagent-report.md',
      'Test HyperAgent Report',
      'Validación de redacción técnica automatizada',
      'Contexto previo de prueba'
    );

    assert.equal(result.action, 'CREATE');
    assert.ok(result.bytesWritten > 0);
    assert.ok(result.contentSnippet.includes('---'));
    console.log(`  ✓ HyperEditor generó archivo: ${result.filePath} (${result.bytesWritten} bytes)`);
  });

  it('4. HyperExecutor verifica e indexa el Vault', async () => {
    const executor = new HyperExecutor();
    const dummyTask = {
      id: 'test-exec-1',
      stepNumber: 3,
      role: 'EXECUTOR' as const,
      title: 'Verificación',
      instruction: 'Indexar y verificar',
      status: 'PENDING' as const
    };

    const result = await executor.executeSubTask(dummyTask);
    assert.equal(result.success, true);
    assert.ok(result.executionTimeMs >= 0);
    console.log(`  ✓ HyperExecutor completó verificación en ${result.executionTimeMs}ms`);
  });

  it('5. HyperOrchestrator ejecuta el ciclo de vida completo de 4 roles', async () => {
    const orchestrator = new HyperOrchestrator();
    const events: string[] = [];

    const result = await orchestrator.runTask('Evaluación comparativa de motores TTS', (evt) => {
      events.push(evt.type);
    });

    assert.equal(result.success, true);
    assert.ok(result.totalTimeMs > 0);
    assert.ok(events.includes('PLAN_CREATED'));
    assert.ok(events.includes('TASK_FINISHED'));
    console.log(`  ✓ HyperOrchestrator completó meta: "${result.goal}" en ${result.totalTimeMs}ms`);
    console.log(`  ✓ Artefactos generados: ${result.artifactsCreated.length}`);
  });
});
