import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TelegramBotBridge } from '../src/bot.js';

describe('TelegramBotBridge Test Suite', () => {
  const bridge = new TelegramBotBridge({
    allowedUserIds: [999]
  });

  it('debe rechazar usuarios no autorizados', async () => {
    const res = await bridge.handleMessage({
      messageId: 1,
      chatId: 10,
      userId: 111, // Unauthorized
      text: '/intel',
      date: Date.now()
    });

    assert.ok(res.text.includes('Acceso no autorizado'));
  });

  it('debe responder al comando /start con la lista de opciones', async () => {
    const res = await bridge.handleMessage({
      messageId: 2,
      chatId: 10,
      userId: 999,
      text: '/start',
      date: Date.now()
    });

    assert.ok(res.text.includes('TrautsLab OS'));
    assert.ok(res.text.includes('/intel'));
    assert.ok(res.text.includes('/agenda'));
  });

  it('debe responder al comando /agenda consultando el Tier 2 Cache', async () => {
    const res = await bridge.handleMessage({
      messageId: 3,
      chatId: 10,
      userId: 999,
      text: '/agenda',
      date: Date.now()
    });

    assert.ok(res.text.includes('Agenda de Hoy') || res.text.includes('agenda'));
  });

  it('debe procesar consultas libres de texto mediante el 3-Tier Voice Pipeline', async () => {
    const res = await bridge.handleMessage({
      messageId: 4,
      chatId: 10,
      userId: 999,
      text: '¿qué compromisos tengo en mi agenda hoy?',
      date: Date.now()
    });

    assert.strictEqual(res.tier, 'TIER_2_CACHE');
    assert.ok(res.text.includes('TIER_2_CACHE'));
  });
});
