#!/usr/bin/env node
import path from 'node:path';
import { VaultIndexer } from './indexer.js';
import { VaultWatcher } from './watcher.js';
import { VaultHealthChecker } from './health-check.js';
import { Tier2CacheManager } from './cache-manager.js';
import { resolveVaultRoot } from './config.js';

const command = process.argv[2] || 'index';
const targetVault = resolveVaultRoot(process.argv[3]);

async function main() {
  console.log(`\n🧠 [TrautsLab OS — Vault Engine]`);
  console.log(`📁 Vault Root: ${targetVault}\n`);

  switch (command) {
    case 'index': {
      console.log('📑 Ejecutando escaneo e indexación jerárquica...');
      const indexer = new VaultIndexer(targetVault);
      const result = await indexer.buildIndices();
      console.log(`\n✓ Índice Maestro: ${result.masterIndex}`);
      for (const [domain, subPath] of Object.entries(result.subIndices)) {
        console.log(`  └─ Sub-índice [${domain}]: ${subPath}`);
      }
      console.log('\n🎉 ¡Indexación completada con éxito!\n');
      break;
    }

    case 'watch': {
      console.log('👁️ Iniciando observador en tiempo real con auto-indexación...');
      const watcher = new VaultWatcher(targetVault, 500);
      watcher.start();
      break;
    }

    case 'health': {
      console.log('🩺 Evaluando salud del Vault y conformidad de Frontmatter...');
      const checker = new VaultHealthChecker(targetVault);
      const report = await checker.runHealthCheck();
      console.log(`- Total de Archivos Markdown: ${report.totalFiles}`);
      console.log(`- Archivos con Frontmatter Válido: ${report.indexedFiles}`);
      console.log(`- Estado General: ${report.healthy ? '✅ Saludable' : '⚠️ Advertencias Detectadas'}`);
      
      if (report.issues.length > 0) {
        console.log('\nDetalle de Advertencias:');
        report.issues.forEach(i => console.log(`  [${i.type}] ${i.filePath}: ${i.message}`));
      }
      console.log('');
      break;
    }

    case 'cache:get': {
      const key = process.argv[4] || 'today-intel';
      console.log(`⚡ Consultando clave de caché Tier 2: "${key}"...`);
      const cacheMgr = new Tier2CacheManager(targetVault);
      const data = await cacheMgr.getCache(key);
      if (data) {
        console.log('\n' + JSON.stringify(data, null, 2));
      } else {
        console.log(`❌ Clave "${key}" no encontrada en OUTPUT/cache/`);
      }
      break;
    }

    case 'cache:tts': {
      const key = process.argv[4] || 'today-agenda';
      const cacheMgr = new Tier2CacheManager(targetVault);
      const snippet = await cacheMgr.getTtsSnippet(key);
      if (snippet) {
        console.log(`\n🔊 Resumen Fonético para Kokoro TTS:\n"${snippet}"\n`);
      } else {
        console.log(`❌ No hay resumen fonético para "${key}"`);
      }
      break;
    }

    default:
      console.log(`Comandos disponibles: index | watch | health | cache:get <key> | cache:tts <key>`);
  }
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
