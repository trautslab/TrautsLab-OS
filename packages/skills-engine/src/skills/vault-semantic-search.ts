import { HybridSearchEngine } from '@trautslab/vault-engine';
import { Skill, SkillContext, SkillMetadata, SkillResult } from '../types.js';

export class VaultSemanticSearchSkill implements Skill {
  metadata: SkillMetadata = {
    id: 'vault-semantic-search',
    name: 'Vault Hybrid Semantic & Lexical Search',
    domain: 'research',
    description: 'Busca notas y documentos en el Obsidian Vault combinando relevancia semántica (embeddings) y coincidencia léxica (BM25).',
    tier: 1
  };

  async execute(ctx: SkillContext): Promise<SkillResult> {
    const query = String(ctx.args?.query || ctx.args?.text || '').trim();
    if (!query) {
      return {
        success: false,
        skillId: this.metadata.id,
        executionTimeMs: 0,
        message: 'Debes proporcionar una consulta de búsqueda en el parámetro "query".'
      };
    }

    const topK = Number(ctx.args?.topK) || 5;
    const searchEngine = new HybridSearchEngine(ctx.vaultRoot);
    const results = await searchEngine.search(query, { topK });

    if (results.length === 0) {
      return {
        success: true,
        skillId: this.metadata.id,
        executionTimeMs: 0,
        message: `No se encontraron notas en el Vault relevantes para la consulta: "${query}".`
      };
    }

    const summaryLines = results.map((r, i) => 
      `${i + 1}. **${r.title}** (Relevancia: ${Math.round(r.score * 100)}%, Dominio: ${r.domain})\n   - Ruta: \`${r.relativePath}\`\n   - Resumen: ${r.excerpt}`
    );

    return {
      success: true,
      skillId: this.metadata.id,
      executionTimeMs: 0,
      message: `Encontré ${results.length} notas relevantes en tu Vault:\n\n${summaryLines.join('\n\n')}`,
      artifactsCreated: results.map(r => r.filePath)
    };
  }
}
