/**
 * TrautsLab OS — Hybrid Vector & Lexical Search Engine
 * Combines BM25 Lexical Scoring with Local Ollama Semantic Embeddings (Cosine Similarity).
 */

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export interface SearchResult {
  filePath: string;
  relativePath: string;
  title: string;
  domain: string;
  summary: string;
  tags: string[];
  score: number;
  bm25Score: number;
  semanticScore: number;
  excerpt: string;
}

export interface HybridSearchOptions {
  vaultRoot: string;
  query: string;
  topK?: number;
  alpha?: number; // 0.0 to 1.0 (weight of BM25 vs Semantic; 0.5 default)
  ollamaEndpoint?: string;
  embeddingModel?: string;
}

export class HybridSearchEngine {
  private vaultRoot: string;
  private ollamaEndpoint: string;
  private embeddingModel: string;

  constructor(vaultRoot: string, options?: { ollamaEndpoint?: string; embeddingModel?: string }) {
    this.vaultRoot = vaultRoot;
    this.ollamaEndpoint = options?.ollamaEndpoint || 'http://localhost:11434';
    this.embeddingModel = options?.embeddingModel || 'qwen2.5:3b';
  }

  /**
   * Calculate BM25 lexical score for a query against a document text
   */
  private calculateBM25Score(queryTerms: string[], docText: string, title: string, tags: string[]): number {
    const lowerDoc = docText.toLowerCase();
    const lowerTitle = title.toLowerCase();
    const lowerTags = tags.map(t => t.toLowerCase()).join(' ');

    let score = 0;
    const docWords = lowerDoc.split(/\W+/).filter(w => w.length > 2);
    const docLength = docWords.length || 1;
    const avgDocLength = 250; // Reference average length
    const k1 = 1.5;
    const b = 0.75;

    for (const term of queryTerms) {
      if (term.length < 2) continue;
      let termFreq = 0;

      // Count occurrences in body
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = lowerDoc.match(regex);
      if (matches) termFreq += matches.length;

      // Bonus weighting for title and tags match
      if (lowerTitle.includes(term)) termFreq += 5;
      if (lowerTags.includes(term)) termFreq += 3;

      if (termFreq > 0) {
        // BM25 term saturation formula
        const termScore = (termFreq * (k1 + 1)) / (termFreq + k1 * (1 - b + b * (docLength / avgDocLength)));
        score += termScore;
      }
    }

    return score;
  }

  /**
   * Request embedding vector from local Ollama endpoint
   */
  private async getEmbedding(text: string): Promise<number[] | null> {
    try {
      const truncated = text.slice(0, 1500); // Truncate to reasonable context
      const res = await fetch(`${this.ollamaEndpoint}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.embeddingModel,
          prompt: truncated,
          keep_alive: '60m'
        })
      });

      if (!res.ok) return null;
      const data = (await res.json()) as { embedding: number[] };
      return data.embedding || null;
    } catch {
      return null;
    }
  }

  /**
   * Compute Cosine Similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Collect all Markdown files in the Vault
   */
  private collectMarkdownFiles(dir: string): string[] {
    const files: string[] = [];
    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.collectMarkdownFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  /**
   * Perform Hybrid Vector & BM25 Search
   */
  public async search(query: string, options?: { topK?: number; alpha?: number }): Promise<SearchResult[]> {
    const topK = options?.topK || 5;
    const alpha = options?.alpha ?? 0.5; // 50% BM25, 50% Semantic
    const queryTerms = query.toLowerCase().split(/\W+/).filter(w => w.length > 2);

    const mdFiles = this.collectMarkdownFiles(this.vaultRoot);
    if (mdFiles.length === 0) return [];

    // Optional query embedding if Ollama is accessible
    const queryEmbedding = await this.getEmbedding(query);

    const rawResults: {
      filePath: string;
      relativePath: string;
      title: string;
      domain: string;
      summary: string;
      tags: string[];
      bm25Score: number;
      semanticScore: number;
      excerpt: string;
    }[] = [];

    for (const file of mdFiles) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const parsed = matter(content);
        const relativePath = path.relative(this.vaultRoot, file);

        const title = parsed.data.title || path.basename(file, '.md');
        const domain = parsed.data.domain || 'general';
        const summary = parsed.data.summary || '';
        const tags = Array.isArray(parsed.data.tags) ? parsed.data.tags : [];

        // BM25 calculation
        const bm25Score = this.calculateBM25Score(queryTerms, parsed.content, title, tags);

        // Semantic embedding calculation
        let semanticScore = 0;
        if (queryEmbedding && (bm25Score > 0 || queryTerms.length > 0)) {
          const docSnippet = `${title}. ${summary}. ${parsed.content.slice(0, 500)}`;
          const docEmbedding = await this.getEmbedding(docSnippet);
          if (docEmbedding) {
            semanticScore = Math.max(0, this.cosineSimilarity(queryEmbedding, docEmbedding));
          }
        }

        // Generate clean excerpt
        let excerpt = summary;
        if (!excerpt) {
          const cleanBody = parsed.content.replace(/#+\s*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
          excerpt = cleanBody.slice(0, 180).replace(/\s+/g, ' ') + '...';
        }

        rawResults.push({
          filePath: file,
          relativePath,
          title,
          domain,
          summary,
          tags,
          bm25Score,
          semanticScore,
          excerpt
        });
      } catch {
        continue;
      }
    }

    // Normalize BM25 scores
    const maxBM25 = Math.max(...rawResults.map(r => r.bm25Score), 1);
    const normalized = rawResults.map(r => {
      const normBM25 = r.bm25Score / maxBM25;
      const combinedScore = queryEmbedding
        ? alpha * normBM25 + (1 - alpha) * r.semanticScore
        : normBM25;

      return {
        ...r,
        score: Math.round(combinedScore * 100) / 100
      };
    });

    // Sort by combined score descending
    return normalized
      .filter(r => r.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}
