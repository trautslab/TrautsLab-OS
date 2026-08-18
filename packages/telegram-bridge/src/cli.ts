#!/usr/bin/env node
/**
 * TrautsLab OS — Telegram Bridge CLI Runner & Polling Daemon
 */

import { TelegramBotBridge } from './bot.js';
import { TelegramPoller } from './poller.js';
import { getTelegramConfig } from './notifier.js';

async function main() {
  const config = getTelegramConfig();
  const isSimulation = process.argv.includes('--simulate');

  console.log('\n======================================================');
  console.log('🤖 [TrautsLab OS — Telegram Assistant Bridge]');
  console.log(`📡 Modo: ${isSimulation ? 'SIMULACIÓN LOCAL' : 'BOT EN VIVO (POLLING)'}`);
  console.log(`👤 Propietario: Jhonny Lorenzo (ID: ${config.chatId || 'N/A'})`);
  console.log('======================================================\n');

  if (isSimulation || !config.botToken) {
    console.log('🧪 Ejecutando suite de simulación de comandos móviles...\n');
    const bridge = new TelegramBotBridge({ allowedUserIds: [parseInt(config.chatId || '8431939545', 10)] });

    // 1. Start Command
    console.log('1. Usuario envía: /start');
    let res = await bridge.handleMessage({ messageId: 1, chatId: 100, userId: parseInt(config.chatId || '8431939545', 10), text: '/start', date: Date.now() });
    console.log(`🤖 Respuesta Telegram:\n${res.text}\n`);

    // 2. Intel Command
    console.log('2. Usuario envía: /intel');
    res = await bridge.handleMessage({ messageId: 2, chatId: 100, userId: parseInt(config.chatId || '8431939545', 10), text: '/intel', date: Date.now() });
    console.log(`🤖 Respuesta Telegram:\n${res.text}\n`);

    // 3. Agenda Command
    console.log('3. Usuario envía: /agenda');
    res = await bridge.handleMessage({ messageId: 3, chatId: 100, userId: parseInt(config.chatId || '8431939545', 10), text: '/agenda', date: Date.now() });
    console.log(`🤖 Respuesta Telegram:\n${res.text}\n`);

    console.log('✓ Simulación completada con éxito.');
  } else {
    console.log(`🚀 Iniciando demonio de Telegram para @TrautsLabBot...`);
    const poller = new TelegramPoller();
    await poller.start();
  }
}

main().catch(err => {
  console.error('Error en Telegram Bridge:', err);
  process.exit(1);
});
