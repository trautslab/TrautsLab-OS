/**
 * TrautsLab OS — HyperExecutor
 * Execution Agent: Executes verification, re-indexing, sandboxed actions, and manages the Self-Repair loop.
 */

import fs from 'node:fs';
import { VaultIndexer } from '@trautslab/vault-engine';
import { HyperExecutorResult, HyperSubTask } from './types.js';

export class HyperExecutor {
  private indexer: VaultIndexer;
  private vaultPath: string;

  constructor(vaultPath = '/Users/jlorenzor/Documents/Obsidian Vault') {
    this.vaultPath = vaultPath;
    this.indexer = new VaultIndexer(vaultPath);
  }

  async executeSubTask(
    task: HyperSubTask,
    targetFile?: string,
    repairFn?: (errorMsg: string) => Promise<string>
  ): Promise<HyperExecutorResult> {
    const startTime = Date.now();
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        if (targetFile) {
          if (!fs.existsSync(targetFile)) {
            throw new Error(`El archivo generado ${targetFile} no existe en el disco.`);
          }

          const content = fs.readFileSync(targetFile, 'utf-8');
          if (!content.startsWith('---') || !content.includes('title:')) {
            throw new Error(`Frontmatter YAML inválido o incompleto en ${targetFile}`);
          }
        }

        // Re-index the Vault to ensure all tables of contents are synchronized
        const reindexResult = await this.indexer.buildIndices();
        const artifacts = [
          reindexResult.masterIndex,
          ...Object.values(reindexResult.subIndices)
        ];

        const executionTimeMs = Date.now() - startTime;
        return {
          subTaskId: task.id,
          success: true,
          message: `Verificación e indexación completadas con éxito en el Vault.`,
          executionTimeMs,
          artifacts,
          repaired: retries > 0
        };
      } catch (err: any) {
        retries++;
        const errorMsg = err.message || String(err);

        if (repairFn && retries < maxRetries) {
          // Attempt Self-Repair Loop
          await repairFn(errorMsg);
        } else {
          const executionTimeMs = Date.now() - startTime;
          return {
            subTaskId: task.id,
            success: false,
            message: `Fallo tras ${retries} intentos: ${errorMsg}`,
            executionTimeMs
          };
        }
      }
    }

    return {
      subTaskId: task.id,
      success: false,
      message: `Fallo por agotamiento de reintentos (${maxRetries}).`,
      executionTimeMs: Date.now() - startTime
    };
  }
}
