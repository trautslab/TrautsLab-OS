#!/usr/bin/env node
/**
 * TrautsLab OS — Telegram Bridge CLI Runner & Simulator
 */

import { TelegramBotBridge } from './bot.js';

async function main() {
  const isSimulation = process.argv.includes('--simulate') || !process.env.TELEGRAM_BOT_TOKEN;
  const bridge = new TelegramBotBridge({ allowedUserIds: [123456] });

  console.log('\n======================================================');
  console.log('🤖 [TrautsLab OS — Telegram Assistant Bridge]');
  console.log(`📡 Modo: ${isSimulation ? 'SIMULACIÓN LOCAL' : 'BOT EN VIVO (POLLING)'}`);
  console.log('======================================================\n');

  if (isSimulation) {
    console.log('🧪 Ejecutando suite de simulación de comandos móviles...\n');

    // 1. Start Command
    console.log('1. Usuario envía: /start');
    let res = await bridge.handleMessage({ messageId: 1, chatId: 100, userId: 123456, text: '/start', date: Date.now() });
    console.log(`🤖 Respuesta Telegram:\n${res.text}\n`);

    // 2. Intel Command
    console.log('2. Usuario envía: /intel');
    res = await bridge.handleMessage({ messageId: 2, chatId: 100, userId: 123456, text: '/intel', date: Date.now() });
    console.log(`🤖 Respuesta Telegram:\n${res.text}\n`);

    // 3. Agenda Command
    console.log('3. Usuario envía: /agenda');
    res = await bridge.handleMessage({ messageId: 3, chatId: 100, userId: 123456, text: '/agenda', date: Date.now() });
    console.log(`🤖 Respuesta Telegram:\n${res.text}\n`);

    // 4. Voice Note Simulation
    console.log('4. Usuario envía: [Nota de voz de 3 segundos]');
    res = await bridge.handleMessage({ messageId: 4, chatId: 100, userId: 123456, voiceFileId: 'voice_mock_001', date: Date.now() });
    console.log(`🤖 Respuesta Telegram:\n${res.text}\n`);

    console.log('✓ Simulación completada con éxito.');
  } else {
    console.log('Conectando con la API de Telegram con token:', process.env.TELEGRAM_BOT_TOKEN?.slice(0, 8) + '...');
    // Real polling daemon logic
  }
}

main().catch(err => {
  console.error('Error en Telegram Bridge:', err);
  process.exit(1);
});
