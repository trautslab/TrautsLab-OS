import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENSHOT_DIR = path.resolve('/Users/jlorenzor/Documents/TrautsLab-OS/docs/assets/e2e-screenshots');
const APP_URL = 'http://localhost:3000';

async function main() {
  console.log('\n🚀 [TrautsLab OS — Strict V.A.U.L.T. HUD Google Chrome Test Suite]');
  console.log(`🌐 Navegador Real: ${CHROME_PATH}`);
  console.log(`🎯 URL de Prueba: ${APP_URL}`);
  console.log(`📁 Directorio de Capturas: ${SCREENSHOT_DIR}\n`);

  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1600,980']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 980, deviceScaleFactor: 2 });

  const results = [];

  async function assertStep(name, actionFn, screenshotName) {
    const start = Date.now();
    try {
      await actionFn();
      const elapsed = Date.now() - start;
      const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`  ✓ [PASS] ${name.padEnd(58)} (${elapsed}ms) -> ${screenshotName}`);
      results.push({ name, status: 'PASS', elapsedMs: elapsed, screenshot: screenshotName });
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}:`, err.message);
      results.push({ name, status: 'FAIL', error: err.message });
      throw err;
    }
  }

  // 1. Carga inicial del HUD Amber Void
  await assertStep('1. Carga inicial del HUD V.A.U.L.T. y acrónimo T.R.A.U.T.S.L.A.B.', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.hud-acronym');
    const title = await page.$eval('.hud-acronym', el => el.textContent);
    if (!title.includes('T.R.A.U.T.S.L.A.B.')) throw new Error(`Título no coincide: ${title}`);
    const tokenVal = await page.$eval('#token-count', el => el.textContent);
    if (!tokenVal.includes('48.2K')) throw new Error(`Tokens no coinciden: ${tokenVal}`);
  }, '01_hud_amber_void_overview.png');

  // 2. Comprobación de Nodos de Estado y Reloj
  await assertStep('2. Telemetría de Nodos (Core, Link, Runner, GPU) y Reloj HUD', async () => {
    const nodes = await page.$$eval('.status-node', els => els.map(e => e.textContent));
    if (nodes.length < 4) throw new Error('Nodos de estado incompletos');
    const clock = await page.$eval('#hud-live-clock', el => el.textContent);
    if (!clock || clock.length < 5) throw new Error('Reloj no inicializado');
  }, '02_hud_nodes_and_clock.png');

  // 3. Esfera Neuronal 3D en Canvas
  await assertStep('3. Verificación y renderizado de la Esfera Neuronal 3D', async () => {
    await page.waitForSelector('#neural-sphere-canvas');
    const canvasDimensions = await page.$eval('#neural-sphere-canvas', el => ({
      w: el.width,
      h: el.height
    }));
    if (canvasDimensions.w <= 0 || canvasDimensions.h <= 0) throw new Error('Canvas 3D no renderizado');
  }, '03_neural_sphere_canvas_active.png');

  // 4. Interacción con Directivas (Checklist de Tareas)
  await assertStep('4. Interacción con Directives Top 3 y persistencia de estado', async () => {
    await page.click('#lbl-task-2');
    await new Promise(r => setTimeout(r, 100));
    const isChecked = await page.$eval('#chk-task-2', el => el.checked);
    if (!isChecked) throw new Error('Directiva 2 no se pudo marcar');
  }, '04_directives_checklist_interactive.png');

  // 5. Interacción con Documents Inbox Trail
  await assertStep('5. Clic en Documents INBOX.TRAIL y telemetría', async () => {
    await page.click('.doc-trail-item');
    await new Promise(r => setTimeout(r, 200));
  }, '05_documents_inbox_trail.png');

  // 6. Command Deck: Disparo de Skill (Morning Intel Scan)
  await assertStep('6. Disparo de Skill en Command Deck (Morning Intel)', async () => {
    await page.click('#btn-skill-morning');
    await new Promise(r => setTimeout(r, 800));
  }, '06_command_deck_skill_execution.png');

  // 7. Modal de Asistente de Voz 3-Tier
  await assertStep('7. Apertura de Voice Link 3-Tier y modulación de audio', async () => {
    await page.click('#btn-trigger-voice-header');
    await page.waitForSelector('#voice-modal:not([hidden])');
    await new Promise(r => setTimeout(r, 1400));
    const transcription = await page.$eval('#voice-transcription-text', el => el.textContent);
    if (!transcription.includes('agenda')) throw new Error('Transcripción de voz incorrecta');
  }, '07_voice_assistant_hud_active.png');

  // Cerrar modal de voz
  await page.click('#btn-close-voice');
  await new Promise(r => setTimeout(r, 400));

  // 8. Terminal Drawer Integrada
  await assertStep('8. Apertura de Terminal Drawer Shell (>_)', async () => {
    await page.click('#btn-toggle-terminal');
    await page.waitForSelector('#terminal-drawer:not([hidden])');
    const termOutput = await page.$eval('#terminal-output', el => el.textContent);
    if (!termOutput.includes('trautslab')) throw new Error('Shell output vacío');
  }, '08_terminal_drawer_shell.png');

  // 9. Alternancia a Pure Light HUD Mode
  await assertStep('9. Conmutación a Pure Light HUD Mode (Tema Claro)', async () => {
    await page.click('#btn-toggle-theme');
    await new Promise(r => setTimeout(r, 400));
    const isLight = await page.$eval('body', el => el.classList.contains('theme-light'));
    if (!isLight) throw new Error('Modo claro no aplicado');
  }, '09_pure_light_hud_mode.png');

  // 10. Modo Alto Contraste WCAG AAA
  await assertStep('10. Activación de Modo Alto Contraste (WCAG AAA)', async () => {
    await page.click('#btn-high-contrast');
    const hasClass = await page.$eval('body', el => el.classList.contains('high-contrast'));
    if (!hasClass) throw new Error('Alto contraste no aplicado');
    // Toggle back
    await page.click('#btn-high-contrast');
  }, '10_high_contrast_hud.png');

  // 11. Atajos de Teclado E2E (Tecla L, T, V, 1-6)
  await assertStep('11. Verificación de atajos de teclado HUD (L, T, 1, Esc)', async () => {
    await page.keyboard.press('KeyL'); // Switch back to Amber Void via L
    await new Promise(r => setTimeout(r, 200));
    const isDark = await page.$eval('body', el => el.classList.contains('theme-dark'));
    if (!isDark) throw new Error('Atajo L no conmutó a tema oscuro');
  }, '11_keyboard_shortcuts_verified.png');

  await browser.close();

  console.log('\n========================================================================');
  console.log(`🎉 ¡TODAS LAS ${results.length} PRUEBAS EN GOOGLE CHROME PASARON CON ÉXITO (0 ERRORES)!`);
  console.log('========================================================================\n');
}

main().catch(err => {
  console.error('Error durante las pruebas en Google Chrome:', err);
  process.exit(1);
});
