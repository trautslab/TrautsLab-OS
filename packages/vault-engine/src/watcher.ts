import path from 'node:path';
import chokidar from 'chokidar';
import { VaultIndexer } from './indexer.js';

export class VaultWatcher {
  private vaultRoot: string;
  private indexer: VaultIndexer;
  private debounceTimer: NodeJS.Timeout | null = null;
  private debounceMs: number;

  constructor(vaultRoot: string, debounceMs: number = 500) {
    this.vaultRoot = path.resolve(vaultRoot);
    this.indexer = new VaultIndexer(this.vaultRoot);
    this.debounceMs = debounceMs;
  }

  /**
   * Start watching the vault for markdown file modifications
   */
  start(): void {
    console.log(`[VaultWatcher] 👁️ Iniciando observador en: ${this.vaultRoot}`);

    const watcher = chokidar.watch(this.vaultRoot, {
      ignored: [
        '**/index.md',
        '**/AGENTS.md',
        '**/CLAUDE.md',
        '**/.obsidian/**',
        '**/node_modules/**',
        '**/.git/**',
        '**/OUTPUT/cache/**'
      ],
      persistent: true,
      ignoreInitial: true
    });

    const triggerReindex = (event: string, filePath: string) => {
      const rel = path.relative(this.vaultRoot, filePath);
      console.log(`[VaultWatcher] Evento detectado (${event}): ${rel}`);

      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(async () => {
        try {
          console.log(`[VaultWatcher] 🔄 Ejecutando re-indexación jerárquica con debounce (${this.debounceMs}ms)...`);
          const result = await this.indexer.buildIndices();
          console.log(`[VaultWatcher] ✓ Re-indexado completado. Índice maestro actualizado: ${result.masterIndex}`);
        } catch (err) {
          console.error(`[VaultWatcher] ❌ Error durante la re-indexación:`, err);
        }
      }, this.debounceMs);
    };

    watcher
      .on('add', p => triggerReindex('add', p))
      .on('change', p => triggerReindex('change', p))
      .on('unlink', p => triggerReindex('unlink', p))
      .on('error', err => console.error('[VaultWatcher] Error en observador:', err));

    console.log(`[VaultWatcher] ✓ Demonio activo y escuchando eventos.`);
  }
}
