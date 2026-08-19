/**
 * TrautsLab OS — HyperNavigator
 * Navigation Agent: Traverses the Obsidian Vault and codebase using hybrid BM25 + vector search.
 */

import { HybridSearchEngine } from '@trautslab/vault-engine';
import { HyperNavigatorResult } from './types.js';

export class HyperNavigator {
  private searchEngine: HybridSearchEngine;

  constructor(vaultPath = '/Users/jlorenzor/Documents/Obsidian Vault') {
    this.searchEngine = new HybridSearchEngine(vaultPath);
  }

  async navigate(query: string, topK = 3): Promise<HyperNavigatorResult> {
    const searchResults = await this.searchEngine.search(query, { topK, alpha: 0.5 });

    const matchedFiles = searchResults.map((r) => ({
      path: r.relativePath,
      score: r.score,
      summary: r.summary || (r.contentSnippet ? r.contentSnippet.slice(0, 150) : '')
    }));

    const contextSummary = matchedFiles.length > 0
      ? `Se encontraron ${matchedFiles.length} documentos relevantes en el Vault:\n` +
        matchedFiles.map((m, idx) => `${idx + 1}. [${m.path}] (Score: ${(m.score * 100).toFixed(1)}%): ${m.summary}`).join('\n')
      : `No se encontraron documentos previos sobre "${query}". Se procederá con síntesis original.`;

    return {
      query,
      matchedFiles,
      contextSummary
    };
  }
}
