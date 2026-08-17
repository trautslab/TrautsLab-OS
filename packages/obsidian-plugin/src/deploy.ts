import fs from 'node:fs/promises';
import path from 'node:path';

async function deploy() {
  const pluginSrcDir = path.resolve(process.cwd());
  const vaultPluginDir = path.resolve(process.cwd(), '../../vault/.obsidian/plugins/trautslab-command-center');

  console.log(`\n🔌 [TrautsLab OS — Obsidian Plugin Deployer]`);
  console.log(`📦 Origen:  ${pluginSrcDir}`);
  console.log(`🎯 Destino: ${vaultPluginDir}\n`);

  await fs.mkdir(vaultPluginDir, { recursive: true });

  const filesToCopy = ['main.js', 'manifest.json', 'styles.css'];

  for (const file of filesToCopy) {
    const src = path.join(pluginSrcDir, file);
    const dest = path.join(vaultPluginDir, file);
    await fs.copyFile(src, dest);
    console.log(`  ✓ Copiado: ${file} &rarr; ${dest}`);
  }

  console.log('\n🎉 ¡Plugin desplegado en el Vault de Obsidian!');
  console.log('Para activarlo en Obsidian:');
  console.log('  1. Abre Obsidian y entra en Ajustes (Settings) &rarr; Community Plugins.');
  console.log('  2. Activa "TrautsLab OS — Command Center".');
  console.log('  3. Haz clic en el nuevo icono de la barra lateral o ejecuta "Abrir Command Center".\n');
}

deploy().catch(err => {
  console.error('Error al desplegar el plugin:', err);
  process.exit(1);
});
