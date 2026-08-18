/**
 * TrautsLab OS — Telegram Rich Format Showcase
 * Sends all supported message formats, keyboards, media, and cards to Jhonny Lorenzo
 */

import { getTelegramConfig } from './notifier.js';
import fs from 'node:fs';
import path from 'node:path';

async function sendTelegramPost(endpoint: string, payload: any) {
  const { botToken } = getTelegramConfig();
  const url = `https://api.telegram.org/bot${botToken}/${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json() as Promise<any>;
}

async function runShowcase() {
  const { chatId } = getTelegramConfig();
  if (!chatId) throw new Error('TELEGRAM_CHAT_ID no configurado');

  console.log(`🚀 Iniciando demostración de todos los formatos soportados por Telegram para chat: ${chatId}...\n`);

  // ===========================================================================
  // 1. FORMATO 1: Tipografía Rica, Spoilers, Citas y Código (HTML Parse Mode)
  // ===========================================================================
  console.log('1. Enviando Formato 1: Tipografía Avanzada & HTML...');
  await sendTelegramPost('sendMessage', {
    chat_id: chatId,
    parse_mode: 'HTML',
    text: 
`🎨 <b>1. TIPOGRAFÍA Y FORMATOS DE TEXTO (HTML)</b>

• <b>Negrita (Bold):</b> Para títulos y alertas críticas.
• <i>Cursiva (Italic):</i> Para notas o comentarios secundarios.
• <u>Subrayado (Underline):</u> Para enlaces y énfasis visual.
• <s>Tachado (Strikethrough):</s> Para tareas completadas o archivadas.
• <tg-spoiler>Spoiler (Toca para revelar):</tg-spoiler> Contenido protegido u oculto.
• <code>Inline Code:</code> Para comandos como <code>git status</code> o variables.

<blockquote>💬 <b>Cita de Bloque (Blockquote):</b>
"El software local y privado con latencia de 2ms redefine la productividad."
— <i>TrautsLab OS Manifesto</i></blockquote>

<pre><code class="language-typescript">// Bloque de Código TypeScript
const event = {
  title: "Arquitectura IA",
  time: "11:30 AM",
  priority: "HIGH",
  owner: "Jhonny Lorenzo"
};</code></pre>`
  });
  await new Promise(r => setTimeout(r, 1200));

  // ===========================================================================
  // 2. FORMATO 2: Tarjeta de Compromiso / Calendario con Botones Interactivos
  // ===========================================================================
  console.log('2. Enviando Formato 2: Tarjeta de Calendario con Botones (Inline Keyboard)...');
  await sendTelegramPost('sendMessage', {
    chat_id: chatId,
    parse_mode: 'HTML',
    text: 
`📅 <b>2. TARJETA DE COMPROMISO EN VIVO</b>

📌 <b>Actividad:</b> Reunión de Arquitectura TrautsLab OS
🕒 <b>Hora:</b> <code>11:30 AM</code> (PET / UTC-5 - Hora Perú)
🏷️ <b>Prioridad:</b> 🔴 <b>ALTA</b>
📍 <b>Ubicación:</b> Sala Principal / Google Meet
📂 <b>Obsidian:</b> <code>OUTPUT/daily-agenda-2026-08-18.md</code>

<i>¿Qué deseas hacer con este compromiso?</i>`,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📦 Archivar Tarea', callback_data: 'archive_task_1' },
          { text: '✏️ Reprogramar', callback_data: 'reschedule_task_1' }
        ],
        [
          { text: '🌐 Abrir Dashboard HUD', url: 'http://localhost:3000' },
          { text: '🐙 Ver Repositorio', url: 'https://github.com/trautslab/TrautsLab-OS' }
        ]
      ]
    }
  });
  await new Promise(r => setTimeout(r, 1200));

  // ===========================================================================
  // 3. FORMATO 3: Tarjeta de Inteligencia Matutina (Intel Digest)
  // ===========================================================================
  console.log('3. Enviando Formato 3: Tarjeta de Inteligencia Matutina...');
  await sendTelegramPost('sendMessage', {
    chat_id: chatId,
    parse_mode: 'HTML',
    text: 
`⭐ <b>3. REPORTE MATUTINO DE INTELIGENCIA (INTEL DIGEST)</b>
📅 <i>2026-08-18 • Edición Especial IA</i>

🔥 <b>Top 1 GitHub Trending:</b>
└ <code>NousResearch/hermes-agent</code>
   • <b>Métricas:</b> ⭐ 14.8k Stars | 🍴 1.2k Forks
   • <b>Descripción:</b> Framework de agentes con ejecución determinista de herramientas locales.

📰 <b>Top 1 Hacker News:</b>
└ <b>DuckDB v2.0 Architecture Preview</b> (Score: ▲ 482 | 💬 189 comentarios)

🎧 <b>Resumen Fonético (TTS):</b>
<i>"NousResearch lidera las tendencias de IA hoy, mientras que DuckDB presenta avances clave en procesamiento columnar local."</i>`,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔄 Ejecutar Nuevo Escaneo', callback_data: 'run_morning_intel' },
          { text: '📑 Leer en Obsidian', callback_data: 'read_intel_vault' }
        ]
      ]
    }
  });
  await new Promise(r => setTimeout(r, 1200));

  // ===========================================================================
  // 4. FORMATO 4: Tarjeta de Telemetría y Salud del Sistema (System Vitals)
  // ===========================================================================
  console.log('4. Enviando Formato 4: Telemetría & Vitals del Sistema...');
  await sendTelegramPost('sendMessage', {
    chat_id: chatId,
    parse_mode: 'HTML',
    text: 
`📊 <b>4. TELEMETRÍA Y ESTADO DEL SISTEMA</b>

🖥️ <b>Host:</b> Mac Studio (Apple M-Series)
👤 <b>Propietario:</b> <code>Jhonny Lorenzo (jlorenzor)</code>
⏱️ <b>Zona Horaria:</b> <code>PET / UTC-5 (America/Lima)</code>

<b>Rendimiento por Tiers:</b>
• ⚡ <b>Tier 1 (Skills):</b> <code>2ms</code>  [██████████] 100% Determinista
• 📑 <b>Tier 2 (Caché):</b> <code>1ms</code>  [██████████] Ultra-Rápido
• 🤖 <b>Tier 3 (LLM):</b>   <code>1.4s</code> [██████░░░░] Qwen 2.5 7B

<b>Estado de Recursos:</b>
• 🧠 <b>Memoria Obsidian:</b> 46 Notas Jerárquicas (Patrón Karpathy)
• 🪙 <b>Tokens Consumidos Hoy:</b> 48.2k / 1.0M
• 🟢 <b>Demonios Activos:</b> <code>VoiceServer (3030)</code> • <code>TelegramPoller</code>`,
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🩺 Test de Salud', callback_data: 'system_health_check' },
          { text: '🧹 Limpiar Caché', callback_data: 'clear_cache' }
        ]
      ]
    }
  });
  await new Promise(r => setTimeout(r, 1200));

  // ===========================================================================
  // 5. FORMATO 5: Encuesta Interactiva (Poll)
  // ===========================================================================
  console.log('5. Enviando Formato 5: Encuesta Interactiva (Poll)...');
  await sendTelegramPost('sendPoll', {
    chat_id: chatId,
    question: '🎯 ¿Cuál es tu foco principal de desarrollo para hoy?',
    options: [
      '🤖 Perfeccionar el Asistente de Voz y STT',
      '📦 Automatización y Gestión de Obsidian Vault',
      '📱 Funcionalidades Móviles y Telegram Bot',
      '⚡ Integración de Nuevas Skills Personalizadas'
    ],
    is_anonymous: false,
    allows_multiple_answers: true
  });
  await new Promise(r => setTimeout(r, 1200));

  // ===========================================================================
  // 6. FORMATO 6: Imagen / Infografía con Captura del Dashboard
  // ===========================================================================
  const screenshotPath = '/Users/jlorenzor/Documents/TrautsLab-OS/docs/assets/e2e-screenshots/01_hud_cockpit_view.png';
  if (fs.existsSync(screenshotPath)) {
    console.log('6. Enviando Formato 6: Imagen con Caption Enriquecido...');
    // Send photo via multipart or public URL
    // We can send file buffer with fetch FormData
    const fileBuffer = fs.readFileSync(screenshotPath);
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('photo', blob, 'hud_cockpit.png');
    formData.append('parse_mode', 'HTML');
    formData.append('caption', 
`🖼️ <b>6. IMAGEN Y CAPTURA DE INTERFAZ</b>

🎮 <b>TrautsLab OS HUD Cockpit</b>
• <b>Visualización:</b> Esfera Neural 3D Interactiva
• <b>Modo:</b> Amber Void (Paleta de Alto Rendimiento)
• <b>Estado:</b> Sincronizado en Tiempo Real con Obsidian Vault`);

    const { botToken } = getTelegramConfig();
    await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      body: formData
    });
  }

  console.log('\n🎉 ¡Demostración de formatos completada y enviada a tu Telegram con éxito!');
}

runShowcase().catch(err => {
  console.error('Error en Showcase:', err);
  process.exit(1);
});
