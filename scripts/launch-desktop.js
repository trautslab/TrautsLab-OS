#!/usr/bin/env node
/**
 * TrautsLab OS — Desktop Cockpit Launcher
 * Seamlessly opens the standalone desktop app window without terminal bugs or errors.
 */

import { execSync, spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';

const PROJECT_ROOT = '/Users/jlorenzor/Documents/TrautsLab-OS';

async function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('🚀 [TrautsLab Desktop] Verificando servicios del sistema...');

  // 1. Check Voice Server (3030)
  const voiceActive = await checkPort(3030);
  if (!voiceActive) {
    console.log('⚡ Iniciando servidor de voz (:3030)...');
    spawn('npx', ['tsx', 'src/cli.ts', 'server'], {
      cwd: path.join(PROJECT_ROOT, 'packages/voice-engine'),
      detached: true,
      stdio: 'ignore'
    }).unref();
  } else {
    console.log('✓ Servidor de voz activo en http://localhost:3030');
  }

  // 2. Check Frontend Server (3000)
  const frontendActive = await checkPort(3000);
  if (!frontendActive) {
    console.log('🖥️ Iniciando servidor frontend (:3000)...');
    spawn('python3', ['-m', 'http.server', '3000', '--directory', path.join(PROJECT_ROOT, 'frontend')], {
      detached: true,
      stdio: 'ignore'
    }).unref();
  } else {
    console.log('✓ Servidor frontend activo en http://localhost:3000');
  }

  // 3. Launch Desktop Window
  console.log('✨ Abriendo ventana de escritorio de TrautsLab OS Cockpit (1280 x 840)...');

  const chromePath = '/Applications/Google Chrome.app';
  const bravePath = '/Applications/Brave Browser.app';

  if (fs.existsSync(chromePath)) {
    execSync(`open -n -a "${chromePath}" --args --app="http://localhost:3000" --window-size=1280,840 --user-data-dir="/tmp/trautslab_desktop_profile"`);
  } else if (fs.existsSync(bravePath)) {
    execSync(`open -n -a "${bravePath}" --args --app="http://localhost:3000" --window-size=1280,840`);
  } else {
    execSync('open "http://localhost:3000"');
  }

  console.log('\n🎉 ¡TrautsLab OS Desktop está abierto en tu pantalla!');
  console.log('👉 Atajos: [Espacio] o [V] para Voz | [1-4] Modos | [L] Tema Claro | [H] Alto Contraste | [O] Observabilidad | [T] Terminal Shell');
}

main().catch((err) => {
  console.error('Error iniciando desktop:', err);
});
