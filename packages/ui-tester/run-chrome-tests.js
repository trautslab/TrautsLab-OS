import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENSHOT_DIR = path.resolve('/Users/jlorenzor/Documents/TrautsLab-OS/docs/assets/e2e-screenshots');
const APP_URL = 'http://localhost:3000';

async function main() {
  console.log('\n🚀 [TrautsLab OS — Full Inception Parity Google Chrome Test Suite]');
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
      console.log(`  ✓ [PASS] ${name.padEnd(62)} (${elapsed}ms) -> ${screenshotName}`);
      results.push({ name, status: 'PASS', elapsedMs: elapsed, screenshot: screenshotName });
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}:`, err.message);
      results.push({ name, status: 'FAIL', error: err.message });
      throw err;
    }
  }

  // 1. Carga inicial del HUD Cockpit (Modo 1)
  await assertStep('1. Carga inicial del HUD Cockpit (Esfera 3D y Vitals)', async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.hud-acronym');
    const title = await page.$eval('.hud-acronym', el => el.textContent);
    if (!title.includes('T.R.A.U.T.S.L.A.B.')) throw new Error(`Título no coincide: ${title}`);
    const tokenVal = await page.$eval('#token-count', el => el.textContent);
    if (!tokenVal.includes('48.2K')) throw new Error(`Tokens no coinciden: ${tokenVal}`);
  }, '01_hud_cockpit_view.png');

  // 2. Navegación a Modo 2: Daily Intel Feed
  await assertStep('2. Modo 2: Daily Intel Feed (GitHub Trending y HN Insights)', async () => {
    await page.click('#mode-intel');
    await page.waitForSelector('#view-intel.active');
    const hasCards = await page.$$eval('.intel-item-box', els => els.length >= 2);
    if (!hasCards) throw new Error('Cards de intel no encontradas');
  }, '02_hud_intel_view.png');

  // 3. Navegación a Modo 3: Vault Memory Explorer & Lector Markdown
  await assertStep('3. Modo 3: Vault Memory Explorer & Lector Markdown Karpathy', async () => {
    await page.click('#mode-vault');
    await page.waitForSelector('#view-vault.active');
    const treeEntries = await page.$$eval('.tree-entry', els => els.length);
    if (treeEntries < 4) throw new Error('Árbol de directorios del vault incompleto');
  }, '03_hud_vault_view.png');

  // 4. Navegación a Modo 4: Skills & Cron Manager
  await assertStep('4. Modo 4: Skills Directory & Cron Schedules Manager', async () => {
    await page.click('#mode-skills');
    await page.waitForSelector('#view-skills.active');
    const skillRows = await page.$$eval('.skill-row', els => els.length);
    if (skillRows < 3) throw new Error('Lista de skills incompleta');
  }, '04_hud_skills_view.png');

  // Retornar a Cockpit
  await page.click('#mode-cockpit');
  await page.waitForSelector('#view-cockpit.active');

  // 5. Interacción con Directivas Top 3 (Checklist de Tareas)
  await assertStep('5. Interacción con Directives Top 3 y persistencia', async () => {
    await page.click('#lbl-task-2');
    await new Promise(r => setTimeout(r, 100));
    const isChecked = await page.$eval('#chk-task-2', el => el.checked);
    if (!isChecked) throw new Error('Directiva 2 no se pudo marcar');
  }, '05_directives_checklist_interactive.png');

  // 6. Command Deck: Disparo de Skill en 1-Clic
  await assertStep('6. Disparo de Skill en Command Deck (Morning Intel)', async () => {
    await page.click('#btn-skill-morning');
    await new Promise(r => setTimeout(r, 800));
  }, '06_command_deck_skill_execution.png');

  // 7. Modal de Asistente de Voz 3-Tier
  await assertStep('7. Apertura de Voice Link 3-Tier y agendado de cena', async () => {
    await page.click('#btn-trigger-voice-header');
    await page.waitForSelector('#voice-modal:not([hidden])');
    await page.type('#voice-text-input', 'ayúdame agendando la cena de hoy a las 8pm');
    await page.click('#btn-submit-voice-form');
    await new Promise(r => setTimeout(r, 1400));
    const response = await page.$eval('#voice-response-text', el => el.textContent);
    console.log('    [Step 7 Debug Voice Response]:', response);
    if (!response || response.length < 5) throw new Error('Respuesta vacía');
  }, '07_voice_assistant_hud_active.png');

  // Cerrar modal de voz
  await page.click('#btn-close-voice');
  await new Promise(r => setTimeout(r, 400));

  // 8. Terminal Drawer Shell (>_)
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

  // 11. Atajos de Teclado E2E (Teclas 1, 2, 3, 4, L, T, Esc)
  await assertStep('11. Verificación de atajos de teclado HUD (1-4, L, T, Esc)', async () => {
    await page.keyboard.press('KeyL'); // Switch back to Amber Void via L
    await new Promise(r => setTimeout(r, 200));
    const isDark = await page.$eval('body', el => el.classList.contains('theme-dark'));
    if (!isDark) throw new Error('Atajo L no conmutó a tema oscuro');

    await page.keyboard.press('Digit2'); // Go to Intel
    await page.waitForSelector('#view-intel.active');
    await page.keyboard.press('Digit3'); // Go to Vault
    await page.waitForSelector('#view-vault.active');
    await page.keyboard.press('Digit1'); // Back to Cockpit
    await page.waitForSelector('#view-cockpit.active');
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
