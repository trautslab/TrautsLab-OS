import puppeteer from 'puppeteer-core';
import fs from 'node:fs/promises';
import path from 'node:path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SCREENSHOT_DIR = path.resolve('/Users/jlorenzor/Documents/TrautsLab-OS/docs/assets/e2e-screenshots');
const APP_URL = 'http://localhost:3000';

async function main() {
  console.log('\n📱 [TrautsLab OS — Mobile PWA Google Chrome Test Suite]');
  console.log(`🌐 Navegador Real: ${CHROME_PATH}`);
  console.log(`📱 Dispositivo Emulado: iPhone 14 / Pixel 7 (390 x 844, Retina 3x, Touch)`);
  console.log(`🎯 URL: ${APP_URL}\n`);

  await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });

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

  // 1. Carga Inicial Móvil & PWA
  await assertStep('1. Carga Inicial PWA Móvil y Verificación de Header', async () => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.hud-acronym');
    const isMobileViewport = await page.$eval('.hud-container', el => el.offsetWidth <= 400);
    if (!isMobileViewport) throw new Error('Viewport móvil no adaptado correctamente');
  }, '01_mobile_cockpit.png');

  // 2. Navegación Móvil a Modo 2: Daily Intel
  await assertStep('2. Pestaña Móvil 2: Daily Intel Feed', async () => {
    await page.click('#mode-intel');
    await page.waitForSelector('#view-intel.active');
    await new Promise(r => setTimeout(r, 200));
  }, '02_mobile_intel.png');

  // 3. Navegación Móvil a Modo 3: Vault Memory Explorer
  await assertStep('3. Pestaña Móvil 3: Vault Memory Explorer & Lector', async () => {
    await page.click('#mode-vault');
    await page.waitForSelector('#view-vault.active');
    await new Promise(r => setTimeout(r, 200));
  }, '03_mobile_vault.png');

  // 4. Navegación Móvil a Modo 4: Skills & Cron
  await assertStep('4. Pestaña Móvil 4: Skills & Cron Schedules', async () => {
    await page.click('#mode-skills');
    await page.waitForSelector('#view-skills.active');
    await new Promise(r => setTimeout(r, 200));
  }, '04_mobile_skills.png');

  // Volver a Cockpit
  await page.click('#mode-cockpit');
  await page.waitForSelector('#view-cockpit.active');

  // 5. Asistente de Voz Móvil Modal
  await assertStep('5. Asistente de Voz Móvil 3-Tier Activo', async () => {
    await page.click('#btn-trigger-voice-header');
    await page.waitForSelector('#voice-modal:not([hidden])');
    await new Promise(r => setTimeout(r, 1200));
  }, '05_mobile_voice_modal.png');

  // Cerrar modal
  await page.click('#btn-close-voice');
  await new Promise(r => setTimeout(r, 300));

  // 6. Modo Claro en Pantalla Móvil
  await assertStep('6. Conmutación a Modo Claro en Pantalla Móvil', async () => {
    await page.click('#btn-toggle-theme');
    await new Promise(r => setTimeout(r, 300));
  }, '06_mobile_light_cockpit.png');

  await browser.close();

  console.log('\n========================================================================');
  console.log(`🎉 ¡TODAS LAS ${results.length} PRUEBAS MÓVILES EN GOOGLE CHROME PASARON CON ÉXITO!`);
  console.log('========================================================================\n');
}

main().catch(err => {
  console.error('Error en pruebas móviles:', err);
  process.exit(1);
});
