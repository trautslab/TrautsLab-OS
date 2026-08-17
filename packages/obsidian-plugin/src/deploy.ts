import fs from 'node:fs/promises';
import path from 'node:path';

async function copyDir(src: string, dest: string) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function deploy() {
  const pluginSrcDir = path.resolve(process.cwd());
  const documentsDir = path.resolve('/Users/jlorenzor/Documents');

  // Candidate Obsidian Vault locations
  const targetVaults = [
    path.join(documentsDir, 'Obsidian Vault'),
    path.resolve(process.cwd(), '../../vault')
  ];

  console.log(`\n🔌 [TrautsLab OS — Universal Obsidian Plugin Deployer]`);

  for (const vaultPath of targetVaults) {
    try {
      const obsidianDir = path.join(vaultPath, '.obsidian');
      const targetPluginDir = path.join(obsidianDir, 'plugins', 'trautslab-command-center');

      await fs.mkdir(targetPluginDir, { recursive: true });

      const filesToCopy = ['main.js', 'manifest.json', 'styles.css'];
      for (const file of filesToCopy) {
        const src = path.join(pluginSrcDir, file);
        const dest = path.join(targetPluginDir, file);
        await fs.copyFile(src, dest);
      }

      // Automatically enable plugin in community-plugins.json
      const communityPluginsPath = path.join(obsidianDir, 'community-plugins.json');
      let enabledPlugins: string[] = [];
      try {
        const raw = await fs.readFile(communityPluginsPath, 'utf-8');
        enabledPlugins = JSON.parse(raw);
      } catch {
        enabledPlugins = [];
      }

      if (!enabledPlugins.includes('trautslab-command-center')) {
        enabledPlugins.push('trautslab-command-center');
        await fs.writeFile(communityPluginsPath, JSON.stringify(enabledPlugins, null, 2), 'utf-8');
      }

      console.log(`✓ Desplegado y activado con éxito en: ${vaultPath}`);

      // If this is the main Obsidian Vault, copy the sample memory notes so the user sees the Karpathy tree
      if (vaultPath.includes('Obsidian Vault')) {
        const vaultSource = path.resolve(process.cwd(), '../../vault');
        const itemsToSync = ['WIKI', 'OUTPUT', 'RAW', 'AGENTS.md'];
        for (const item of itemsToSync) {
          const src = path.join(vaultSource, item);
          const dest = path.join(vaultPath, item);
          try {
            const stat = await fs.stat(src);
            if (stat.isDirectory()) {
              await copyDir(src, dest);
            } else {
              await fs.copyFile(src, dest);
            }
          } catch {}
        }
        console.log(`  └─ Sincronizadas carpetas de memoria (WIKI, RAW, OUTPUT, AGENTS.md)`);
      }
    } catch (err) {
      console.warn(`⚠️ No se pudo desplegar en ${vaultPath}:`, err);
    }
  }

  console.log('\n🎉 ¡Despliegue universal completado con éxito!');
  console.log('En Obsidian:');
  console.log('  1. Si tienes Obsidian abierto, presiona Cmd+R (Recargar) o reinicia la app.');
  console.log('  2. Verás el nuevo icono de rayo ⚡ en la barra lateral izquierda.');
  console.log('  3. O presiona Cmd+P y escribe "Abrir Command Center Dashboard".\n');
}

deploy().catch(err => {
  console.error('Error fatal al desplegar:', err);
  process.exit(1);
});
