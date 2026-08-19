/**
 * TrautsLab OS — MCP Server Comprehensive Test Suite
 * Validates protocol negotiation, tools/list, and execution of all 10 MCP tools.
 */

import fs from 'node:fs';
import path from 'node:path';
import { MCPServer } from '../src/server.js';
import { MCPRequest } from '../src/types.js';

async function runMCPTests() {
  console.log('🧪 [MCP Test Suite] Iniciando pruebas del Servidor Model Context Protocol...\n');

  const vaultRoot = fs.existsSync('/Users/jlorenzor/Documents/Obsidian Vault')
    ? '/Users/jlorenzor/Documents/Obsidian Vault'
    : path.resolve(process.cwd(), 'vault');

  const server = new MCPServer({ vaultRoot });

  let passed = 0;
  let failed = 0;

  async function assertReq(desc: string, req: MCPRequest, validate: (res: any) => boolean) {
    try {
      const res = await server.handleRequest(req);
      if (res.error) {
        throw new Error(`RPC Error (${res.error.code}): ${res.error.message}`);
      }
      if (validate(res.result)) {
        console.log(`  ✓ [PASS] ${desc}`);
        passed++;
      } else {
        console.error(`  ✗ [FAIL] ${desc} — Validación de respuesta falló:`, res.result);
        failed++;
      }
    } catch (err: any) {
      console.error(`  ✗ [FAIL] ${desc} — Excepción: ${err.message}`);
      failed++;
    }
  }

  // 1. Initialize
  await assertReq(
    '1. Protocol Handshake: initialize',
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },
    (res) => res.protocolVersion === '2024-11-05' && res.capabilities.tools
  );

  // 2. Tools List (11 tools)
  await assertReq(
    '2. Tools Catalog: tools/list (11 tools registradas)',
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    (res) => Array.isArray(res.tools) && res.tools.length === 11
  );

  // 3. trautslab_vault_read
  await assertReq(
    '3. Tool: trautslab_vault_read (Lectura de WIKI/index.md)',
    {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'trautslab_vault_read', arguments: { relativePath: 'WIKI/index.md' } }
    },
    (res) => !res.isError && res.content[0].text.includes('Tabla de Contenidos Maestra')
  );

  // 4. trautslab_vault_search (BM25)
  await assertReq(
    '4. Tool: trautslab_vault_search (Búsqueda por palabra clave)',
    {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'trautslab_vault_search', arguments: { query: 'Telegram' } }
    },
    (res) => !res.isError && res.content[0].text.length > 0
  );

  // 5. trautslab_vault_semantic_search (Hybrid)
  await assertReq(
    '5. Tool: trautslab_vault_semantic_search (Búsqueda vectorial híbrida)',
    {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: { name: 'trautslab_vault_semantic_search', arguments: { query: 'agendas y compromisos', topK: 3 } }
    },
    (res) => !res.isError && res.content[0].text.length > 0
  );

  // 6. trautslab_calendar_get_agenda
  await assertReq(
    '6. Tool: trautslab_calendar_get_agenda (Consulta de cronograma)',
    {
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: { name: 'trautslab_calendar_get_agenda', arguments: {} }
    },
    (res) => !res.isError && res.content[0].text.length > 0
  );

  // 7. trautslab_calendar_add_event
  await assertReq(
    '7. Tool: trautslab_calendar_add_event (Agendar compromiso)',
    {
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: {
        name: 'trautslab_calendar_add_event',
        arguments: {
          title: 'Reunión de Sincronización MCP',
          date: '2026-08-19',
          time: '04:30 PM',
          location: 'Sala Virtual',
          priority: 'HIGH'
        }
      }
    },
    (res) => !res.isError && res.content[0].text.includes('He agendado')
  );

  // 8. trautslab_calendar_edit_event
  await assertReq(
    '8. Tool: trautslab_calendar_edit_event (Edición in-place)',
    {
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: {
        name: 'trautslab_calendar_edit_event',
        arguments: {
          date: '2026-08-19',
          originalText: 'Reunión de Sincronización MCP',
          newTitle: 'Reunión de Sincronización MCP & Tauri',
          newTime: '05:00 PM'
        }
      }
    },
    (res) => !res.isError && res.content[0].text.includes('actualizado con éxito')
  );

  // 9. trautslab_vault_reindex
  await assertReq(
    '9. Tool: trautslab_vault_reindex (Regenerar tablas de contenidos)',
    {
      jsonrpc: '2.0',
      id: 9,
      method: 'tools/call',
      params: { name: 'trautslab_vault_reindex', arguments: {} }
    },
    (res) => !res.isError && res.content[0].text.includes('reconstruidos')
  );

  // 10. trautslab_telegram_notify
  await assertReq(
    '10. Tool: trautslab_telegram_notify (Notificación push diferida / timer)',
    {
      jsonrpc: '2.0',
      id: 10,
      method: 'tools/call',
      params: {
        name: 'trautslab_telegram_notify',
        arguments: {
          message: 'Prueba MCP completada con éxito',
          title: 'TrautsLab MCP Server',
          delayMinutes: 0
        }
      }
    },
    (res) => !res.isError && res.content[0].text.includes('enviado la notificación')
  );

  // 11. trautslab_hyperagent_run_task
  await assertReq(
    '11. Tool: trautslab_hyperagent_run_task (Ejecución multi-rol HyperAgent)',
    {
      jsonrpc: '2.0',
      id: 11,
      method: 'tools/call',
      params: {
        name: 'trautslab_hyperagent_run_task',
        arguments: {
          goal: 'Investigar arquitecturas de indexación en Obsidian'
        }
      }
    },
    (res) => !res.isError && res.content[0].text.includes('Ejecución HyperAgent')
  );

  console.log('\n========================================================');
  if (failed === 0) {
    console.log(`🎉 ¡TODAS LAS ${passed} PRUEBAS MCP PASARON CON ÉXITO (0 ERRORES)!`);
  } else {
    console.error(`⚠️ Pruebas finalizadas: ${passed} pasadas, ${failed} fallidas.`);
    process.exit(1);
  }
  console.log('========================================================\n');
}

runMCPTests().catch((err) => {
  console.error('Fatal error running MCP tests:', err);
  process.exit(1);
});
