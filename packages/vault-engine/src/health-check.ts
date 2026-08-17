import path from 'node:path';
import { VaultIndexer } from './indexer.js';
import { VaultHealthReport, HealthIssue } from './types.js';

export class VaultHealthChecker {
  private indexer: VaultIndexer;
  private vaultRoot: string;

  constructor(vaultRoot: string) {
    this.vaultRoot = path.resolve(vaultRoot);
    this.indexer = new VaultIndexer(this.vaultRoot);
  }

  async runHealthCheck(): Promise<VaultHealthReport> {
    const files = await this.indexer.scanFiles();
    const issues: HealthIssue[] = [];

    for (const file of files) {
      if (!file.hasFrontmatter) {
        issues.push({
          type: 'missing_frontmatter',
          filePath: file.relativePath,
          message: `El archivo ${file.relativePath} no contiene encabezado YAML Frontmatter.`,
          severity: 'warning'
        });
      }

      if (!file.summary || file.summary.length < 15) {
        issues.push({
          type: 'empty_summary',
          filePath: file.relativePath,
          message: `El archivo ${file.relativePath} no tiene un campo 'summary' descriptivo.`,
          severity: 'warning'
        });
      }
    }

    return {
      totalFiles: files.length,
      indexedFiles: files.filter(f => f.hasFrontmatter).length,
      healthy: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }
}
