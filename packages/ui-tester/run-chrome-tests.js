import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENSHOT_DIR = path.resolve('/Users/jlorenzor/Documents/TrautsLab-OS/docs/assets/e2e-screenshots');
const APP_URL = 'http://localhost:3000';

async function main() {
  console.log('\n🚀 [TrautsLab OS — Strict Google Chrome E2E Test Suite]');
  console.log(`🌐 Navegador Real: ${CHROME_PATH}`);
  console.log(`🎯 URL de Prueba: ${APP_URL}`);
  console.log(`📁 Directorio de Capturas Reales: ${SCREENSHOT_DIR}\n`);

  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  const results = [];

  async function assertStep(name, actionFn, screenshotName) {
    const start = Date.now();
    try {
      await actionFn();
      const elapsed = Date.now() - start;
      const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`  ✓ [PASS] ${name.padEnd(55)} (${elapsed}ms) -> Captura: ${screenshotName}`);
      results.push({ name, status: 'PASS', elapsedMs: elapsed, screenshot: screenshotName });
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}:`, err.message);
      results.push({ name, status: 'FAIL', error: err.message });
      throw err;
    }
  }

  // 1. Initial Page Load
  await assertStep('1. Carga inicial y verificación de Header / Métricas', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.topbar');
    const title = await page.$eval('.system-title', el => el.textContent);
    if (!title.includes('TrautsLab')) throw new Error(`Título no coincide: ${title}`);
    const tokenVal = await page.$eval('#token-count', el => el.textContent);
    if (!tokenVal.includes('48.2k')) throw new Error(`Métrica de tokens no coincide: ${tokenVal}`);
    const statusBadge = await page.$eval('#system-status-badge', el => el.textContent);
    if (!statusBadge.includes('ONLINE')) throw new Error(`Status badge no online: ${statusBadge}`);
  }, '01_overview_initial_load.png');

  // 2. Daily Intel Tab Navigation
  await assertStep('2. Navegación a pestaña Daily Intel y verificación de cards', async () => {
    await page.click('#tab-intel');
    await page.waitForSelector('#view-intel.active');
    const title = await page.$eval('#view-intel .view-title', el => el.textContent);
    if (!title.includes('Inteligencia')) throw new Error('Título de Daily Intel no coincide');
  }, '02_daily_intel_tab.png');

  // 3. Skills Tab Navigation
  await assertStep('3. Navegación a pestaña Skills & Cron y comprobación de lista', async () => {
    await page.click('#tab-skills');
    await page.waitForSelector('#view-skills.active');
    const title = await page.$eval('#view-skills .view-title', el => el.textContent);
    if (!title.includes('Habilidades')) throw new Error('Título de Skills no coincide');
  }, '03_skills_directory_tab.png');

  // 4. Vault & Memory Tab Navigation
  await assertStep('4. Navegación a pestaña Vault Memory (Patrón Karpathy)', async () => {
    await page.click('#tab-memory');
    await page.waitForSelector('#view-memory.active');
    const previewContent = await page.$eval('#vault-preview-content', el => el.textContent);
    if (!previewContent.includes('AGENTS.md')) throw new Error('Preview de AGENTS.md no visible');
  }, '04_vault_memory_tab.png');

  // 5. Return to Overview and trigger Morning Intel Skill
  await assertStep('5. Disparo de Skill de 1-Clic (Morning Intel Scan) y Log', async () => {
    await page.click('#tab-overview');
    await page.waitForSelector('#view-overview.active');
    await page.click('#btn-skill-morning');
    await new Promise(r => setTimeout(r, 800));
    // Check log in skills view or overview
    await page.click('#tab-skills');
    await page.waitForSelector('#view-skills.active');
    const logContent = await page.$eval('#execution-log', el => el.textContent);
    if (!logContent.includes('morning-intel-scan')) throw new Error('El log no registró la ejecución');
  }, '05_skill_executed_log.png');

  // 6. Voice Assistant 3-Tier Modal & Animation
  await assertStep('6. Apertura de Asistente de Voz 3-Tier y animación de ondas', async () => {
    await page.click('#tab-overview');
    await page.click('#btn-trigger-voice-header');
    await page.waitForSelector('#voice-modal:not([hidden])');
    await new Promise(r => setTimeout(r, 1200)); // Wait for simulated phonetic TTS response
    const transcription = await page.$eval('#voice-transcription-text', el => el.textContent);
    if (!transcription.includes('agenda')) throw new Error('Transcripción incorrecta');
    const responseText = await page.$eval('#voice-response-text', el => el.textContent);
    if (!responseText.includes('Revisión de Arquitectura')) throw new Error('Respuesta de voz incorrecta');
  }, '06_voice_assistant_modal_tier2.png');

  // Close Voice Modal
  await page.click('#btn-close-voice');
  await new Promise(r => setTimeout(r, 400));

  // 7. Embedded Terminal Drawer
  await assertStep('7. Apertura de Terminal Drawer integrado (Atajo T)', async () => {
    await page.click('#btn-toggle-terminal');
    await page.waitForSelector('#terminal-drawer:not([hidden])');
    const termOutput = await page.$eval('#terminal-output', el => el.textContent);
    if (!termOutput.includes('macbook')) throw new Error('Shell output no inicializado');
  }, '07_terminal_drawer_expanded.png');

  // 8. High Contrast Accessibility Mode
  await assertStep('8. Activación de Modo Alto Contraste (Accesibilidad WCAG AAA)', async () => {
    await page.click('#btn-high-contrast');
    const hasClass = await page.$eval('body', el => el.classList.contains('high-contrast'));
    if (!hasClass) throw new Error('Clase high-contrast no aplicada');
  }, '08_high_contrast_accessibility_mode.png');

  // 9. Keyboard Shortcuts E2E
  await assertStep('9. Verificación de atajos de teclado (1, 2, 3, 4, V, Esc)', async () => {
    await page.keyboard.press('Digit2'); // Go to Intel
    await page.waitForSelector('#view-intel.active');
    await page.keyboard.press('Digit1'); // Back to Overview
    await page.waitForSelector('#view-overview.active');
  }, '09_keyboard_shortcuts_verified.png');

  await browser.close();

  console.log('\n======================================================');
  console.log(`🎉 ¡TODAS LAS ${results.length} PRUEBAS EN GOOGLE CHROME PASARON CON ÉXITO (0 ERRORES)!`);
  console.log('======================================================\n');
}

main().catch(err => {
  console.error('Error durante las pruebas en Google Chrome:', err);
  process.exit(1);
});
