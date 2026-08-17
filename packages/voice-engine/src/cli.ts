#!/usr/bin/env node
import path from 'node:path';
import { VoicePipeline } from './pipeline.js';
import { VoiceServer } from './server.js';

const command = process.argv[2] || 'simulate';
const targetVault = path.resolve(process.cwd(), '../../vault');

async function main() {
  console.log(`\n🎙️ [TrautsLab OS — 3-Tier Voice Engine]`);
  console.log(`📁 Vault Root: ${targetVault}\n`);

  const pipeline = new VoicePipeline({ vaultRoot: targetVault });

  switch (command) {
    case 'query': {
      const queryText = process.argv[3] || '¿Qué es lo más importante en mi agenda hoy?';
      console.log(`🗣️ Consulta de Entrada: "${queryText}"`);
      console.log('🔄 Procesando a través del Enrutador 3-Tier...\n');

      const res = await pipeline.processQuery({ transcription: queryText });
      console.log(`🏷️  Nivel de Enrutamiento: ${res.tier}`);
      console.log(`🎯 Objetivo: ${res.target}`);
      console.log(`⏱️  Latencia Total: ${res.latencies.totalMs}ms (Router: ${res.latencies.routerMs}ms, Acción: ${res.latencies.actionMs}ms, TTS: ${res.latencies.ttsMs}ms)`);
      console.log(`\n🔊 Respuesta Fonética Sintetizada (Kokoro TTS):`);
      console.log(`"${res.responsePhoneticTts}"\n`);
      break;
    }

    case 'simulate': {
      console.log('🧪 Ejecutando Batería de Simulación de los 3 Tiers de Voz:\n');
      const testQueries = [
        '¿Qué es lo más importante en mi agenda hoy?',
        '¿Cuál es la noticia de IA más importante de hoy?',
        'Ejecuta el escaneo de inteligencia matutino',
        'Planifica una investigación profunda sobre arquitecturas de agentes autónomos'
      ];

      for (let i = 0; i < testQueries.length; i++) {
        const q = testQueries[i];
        console.log(`------------------------------------------------------------`);
        console.log(`[Test ${i + 1}/4] Entrada: "${q}"`);
        const res = await pipeline.processQuery({ transcription: q });
        console.log(`  └─ Nivel: ${res.tier} | Target: ${res.target}`);
        console.log(`  └─ Latencia: ${res.latencies.totalMs}ms`);
        console.log(`  └─ Respuesta: "${res.responsePhoneticTts}"\n`);
      }
      break;
    }

    case 'server': {
      const port = Number(process.argv[3]) || 3030;
      const server = new VoiceServer({ vaultRoot: targetVault, port });
      await server.start();
      break;
    }

    default:
      console.log('Comandos disponibles: simulate | query "<texto>" | server [puerto]');
  }
}

main().catch(err => {
  console.error('Error fatal en Voice Engine:', err);
  process.exit(1);
});
