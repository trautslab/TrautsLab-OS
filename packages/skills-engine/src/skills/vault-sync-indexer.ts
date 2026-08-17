import { VaultIndexer } from '@trautslab/vault-engine';
import { Skill, SkillContext, SkillMetadata, SkillResult } from '../types.js';

export class VaultSyncIndexerSkill implements Skill {
  metadata: SkillMetadata = {
    id: 'vault-sync-indexer',
    name: 'Vault Hierarchical Re-Indexer',
    domain: 'operations',
    description: 'Ejecuta el escaneo completo del Vault y reconstruye todas las tablas de contenido (WIKI/index.md y sub-índices).',
    cronSchedule: '0 */4 * * *', // Cada 4 horas
    tier: 1
  };

  async execute(ctx: SkillContext): Promise<SkillResult> {
    const indexer = new VaultIndexer(ctx.vaultRoot);
    const result = await indexer.buildIndices();

    const created = [result.masterIndex, ...Object.values(result.subIndices)];

    return {
      success: true,
      skillId: this.metadata.id,
      executionTimeMs: 0,
      message: `Índices del Vault reconstruidos exitosamente (${created.length} tablas de contenidos actualizadas).`,
      artifactsCreated: created
    };
  }
}
