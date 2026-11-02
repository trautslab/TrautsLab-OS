#!/usr/bin/env node
/**
 * bin/run-phase2-demo.mjs
 * Phase 2 Execution Demonstration: Alternative Paths
 * Cursor-based pagination, category filtering, and MCP enrichment to prevent Context Window Bloat.
 */

import { AgentCoreGateway } from "../src/gateway/agent-core-gateway.mjs";

async function main() {
  console.log("\x1b[1m\x1b[36m========================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[36m  🎯 FASE 2: ALTERNATIVE PATHS - PAGINACIÓN CURSOR-BASED Y ENRIQUECIMIENTO \x1b[0m");
  console.log("\x1b[1m\x1b[36m  Prevención de 'Context Window Bloat' en LLMs vía Cursores Opacos      \x1b[0m");
  console.log("\x1b[1m\x1b[36m========================================================================\x1b[0m\n");

  const gateway = new AgentCoreGateway();

  // Test 2.1: First Page Query (Limit 3, Category ALL)
  console.log("\x1b[1m\x1b[33m--- [TEST 2.1] Página Inicial (limit: 3, category: ALL) ---\x1b[0m");
  const page1 = await gateway.handleInboundIntent("LIST_ACTIVE_COUPONS", {
    customerId: "ACC-BIAN-7701",
    category: "ALL",
    limit: 3
  });
  console.log("Respuesta ACG (Página 1):", JSON.stringify(page1.payload, null, 2));
  console.log(`✓ Elementos recibidos: ${page1.payload.data.length} de ${page1.payload.pageInfo.totalMatched}`);
  console.log(`✓ HasMore: ${page1.payload.pageInfo.hasMore} | Cursor: \x1b[32m${page1.payload.pageInfo.nextCursorToken}\x1b[0m\n`);

  const nextCursor = page1.payload.pageInfo.nextCursorToken;

  // Test 2.2: Subsequent Page Query using Cursor Token
  console.log("\x1b[1m\x1b[33m--- [TEST 2.2] Página Siguiente usando Cursor Token ---\x1b[0m");
  const page2 = await gateway.handleInboundIntent("LIST_ACTIVE_COUPONS", {
    customerId: "ACC-BIAN-7701",
    category: "ALL",
    limit: 3,
    cursorToken: nextCursor
  });
  console.log("Respuesta ACG (Página 2):", JSON.stringify(page2.payload, null, 2));
  console.log(`✓ Nuevos elementos recibidos: ${page2.payload.data.length}`);
  console.log(`✓ Primer cupón de pág 2: ${page2.payload.data[0].couponId} (${page2.payload.data[0].title})\n`);

  // Test 2.3: Category Filtering (Alternative Path: TRAVEL only)
  console.log("\x1b[1m\x1b[33m--- [TEST 2.3] Filtro de Categoría Específica ('TRAVEL') ---\x1b[0m");
  const travelPage = await gateway.handleInboundIntent("LIST_ACTIVE_COUPONS", {
    customerId: "ACC-BIAN-7701",
    category: "TRAVEL",
    limit: 5
  });
  console.log("Respuesta ACG (Filtro TRAVEL):", JSON.stringify(travelPage.payload, null, 2));
  const allTravel = travelPage.payload.data.every(c => c.category === "TRAVEL");
  console.log(`✓ Todos los cupones pertenecen a TRAVEL: \x1b[1m\x1b[32m${allTravel}\x1b[0m (Total encontrados: ${travelPage.payload.data.length})\n`);

  console.log("\x1b[1m\x1b[32m========================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[32m  🎉 FASE 2 COMPLETADA CON ÉXITO: ALTERNATIVE PATHS OPERANDO EN FLOCI   \x1b[0m");
  console.log("\x1b[1m\x1b[32m  - Paginación cursor-based protege el Context Window del LLM           \x1b[0m");
  console.log("\x1b[1m\x1b[32m  - Filtros semánticos aplicados en el borde antes de transferir datos \x1b[0m");
  console.log("\x1b[1m\x1b[32m========================================================================\x1b[0m\n");
}

main().catch(err => {
  console.error("❌ Falló la ejecución de Fase 2:", err);
  process.exit(1);
});

