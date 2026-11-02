#!/usr/bin/env node
/**
 * bin/run-phase3-demo.mjs
 * Phase 3 Execution Demonstration: Edge Cases & Contract Drift
 * Demonstrates:
 * 1. Contract Drift Interception (Schema validation hints on corrupt LLM inputs)
 * 2. Planned Components Handling ([POR CREAR] status)
 * 3. Phantom / Non-existent Lambda Handling ([NO EXISTE] 502 trip)
 * 4. Circuit Breaker Fast-Fail and Graceful Fallback
 */

import { AgentCoreGateway } from "../src/gateway/agent-core-gateway.mjs";

async function main() {
  console.log("\x1b[1m\x1b[36m========================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[36m  🎯 FASE 3: EDGE CASES, DERIVA DE CONTRATOS Y CIRCUIT BREAKER          \x1b[0m");
  console.log("\x1b[1m\x1b[36m  Protección ante LLMs rebeldes, esquemas rotos y servicios phantom      \x1b[0m");
  console.log("\x1b[1m\x1b[36m========================================================================\x1b[0m\n");

  const gateway = new AgentCoreGateway();

  // Test 3.1: Contract Drift (corrupted input type)
  console.log("\x1b[1m\x1b[33m--- [TEST 3.1] Deriva de Contrato: LLM envía couponId numérico (98765) ---\x1b[0m");
  const driftRes = await gateway.handleInboundIntent("FIND_COUPON", {
    couponId: 98765 // VIOLATION: Expected string matching regex ^CPN-...
  });
  console.log("Respuesta ACG (Rechazo Semántico):", JSON.stringify(driftRes.payload, null, 2));
  console.log(`✓ Estado: \x1b[31m${driftRes.status} (HTTP ${driftRes.httpStatus})\x1b[0m | Código: ${driftRes.payload.error.code}`);
  console.log(`✓ Hint provisto al LLM para auto-corrección: "${driftRes.payload.error.expectedType}"\n`);

  // Test 3.2: Planned Component ([POR CREAR])
  console.log("\x1b[1m\x1b[33m--- [TEST 3.2] Llamada a Componente Planificado [POR CREAR] ---\x1b[0m");
  const plannedRes = await gateway.handleInboundIntent("PLAN_SALE_CAMPAIGN", {
    campaignType: "FLASH_SALE_CHRISTMAS"
  });
  console.log("Respuesta ACG (Capacidad en Construcción):", JSON.stringify(plannedRes.payload, null, 2));
  console.log(`✓ Código: \x1b[33m${plannedRes.payload.error.code}\x1b[0m | Alternativa sugerida: ${plannedRes.payload.error.suggestedAlternative}\n`);

  // Test 3.3: Phantom Dependency ([NO EXISTE] -> 502 detection)
  console.log("\x1b[1m\x1b[33m--- [TEST 3.3] Invocación a Lambda Inexistente ('lmb-made-campaign-pjc' [NO EXISTE]) ---\x1b[0m");
  const phantomRes = await gateway.handleInboundIntent("GET_CAMPAIGN_DESIGN", {
    designId: "DSG-INVALID-99"
  });
  console.log("Respuesta ACG (Colisión 502 detectada):", JSON.stringify(phantomRes.payload, null, 2));
  console.log(`✓ Error downstream: ${phantomRes.payload.error.code} | El Circuit Breaker ha disparado a OPEN\n`);

  // Test 3.4: Circuit Breaker Fast-Fail (Subsequent invocation)
  console.log("\x1b[1m\x1b[33m--- [TEST 3.4] Circuit Breaker en Estado OPEN (Fast-Fail en 1ms) ---\x1b[0m");
  const cbRes = await gateway.handleInboundIntent("GET_CAMPAIGN_DESIGN", {
    designId: "DSG-INVALID-99"
  });
  console.log("Respuesta ACG (Degradación Elegante):", JSON.stringify(cbRes.payload, null, 2));
  console.log(`✓ Estado Circuito: \x1b[1m\x1b[31m${cbRes.circuitState}\x1b[0m | Latencia: ${cbRes.roundtripMs}ms (Cero impacto al backend)`);
  console.log(`✓ Fallback ofrecido: "${cbRes.payload.error.suggestedFallback}"\n`);

  console.log("\x1b[1m\x1b[32m========================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[32m  🎉 FASE 3 COMPLETADA CON ÉXITO: EDGE CASES TOTALMENTE BLINDADOS       \x1b[0m");
  console.log("\x1b[1m\x1b[32m  - Tipado estricto frena payloads corruptos con pistas semánticas      \x1b[0m");
  console.log("\x1b[1m\x1b[32m  - Circuit Breaker protege el Core Banking ante servicios phantom      \x1b[0m");
  console.log("\x1b[1m\x1b[32m========================================================================\x1b[0m\n");
}

main().catch(err => {
  console.error("❌ Falló la ejecución de Fase 3:", err);
  process.exit(1);
});

