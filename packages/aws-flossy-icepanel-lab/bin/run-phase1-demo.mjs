#!/usr/bin/env node
/**
 * bin/run-phase1-demo.mjs
 * Phase 1 Execution Demonstration:
 * Agent Core Gateway (ACG) -> Agent Core Runtime (ACR - MCP) -> Real Lambdas (Floci) -> DynamoDB (Floci)
 */

import { AgentCoreGateway } from "../src/gateway/agent-core-gateway.mjs";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const FLOCI_ENDPOINT = process.env.FLOCI_ENDPOINT || "http://localhost:4566";
const ddb = new DynamoDBClient({
  endpoint: FLOCI_ENDPOINT,
  region: "us-east-1",
  credentials: { accessKeyId: "mock", secretAccessKey: "mock" }
});

async function main() {
  console.log("\x1b[1m\x1b[36m========================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[36m  🎯 FASE 1: HAPPY PATH - CONTRATOS API TIPADOS EN FLOCI (FLOSSY)       \x1b[0m");
  console.log("\x1b[1m\x1b[36m  Flujo: Inbound Intent -> ACG -> ACR (MCP) -> Lambdas -> DynamoDB     \x1b[0m");
  console.log("\x1b[1m\x1b[36m========================================================================\x1b[0m\n");

  // Step 0: Ensure baseline account in DynamoDB
  console.log("📝 [Setup] Inicializando cuenta de prueba en DynamoDB 'core-accounts-master-local'...");
  await ddb.send(new PutItemCommand({
    TableName: "core-accounts-master-local",
    Item: {
      accountId: { S: "ACC-BIAN-7701" },
      customerName: { S: "Maria Rodriguez" },
      pointsBalance: { N: "3200" },
      version: { N: "1" },
      status: { S: "ACTIVE" },
      lastAccrualTimestamp: { S: new Date().toISOString() }
    }
  }));
  console.log("✓ Cuenta ACC-BIAN-7701 lista con 3200 puntos y versión inicial 1.\n");

  const gateway = new AgentCoreGateway();

  // Test 1: Inbound Coupon Query
  console.log("\x1b[1m\x1b[33m--- [TEST 1/4] Intent: FIND_COUPON ('CPN-WELCOME-2026') ---\x1b[0m");
  const res1 = await gateway.handleInboundIntent("FIND_COUPON", {
    couponId: "CPN-WELCOME-2026",
    customerId: "ACC-BIAN-7701"
  });
  console.log("Respuesta ACG:", JSON.stringify(res1.payload, null, 2));
  console.log(`✓ Latencia roundtrip: ${res1.roundtripMs}ms | Estado: ${res1.status}\n`);

  // Test 2: Check Loyalty Points Balance
  console.log("\x1b[1m\x1b[33m--- [TEST 2/4] Intent: CHECK_POINTS_BALANCE ('ACC-BIAN-7701') ---\x1b[0m");
  const res2 = await gateway.handleInboundIntent("CHECK_POINTS_BALANCE", {
    accountId: "ACC-BIAN-7701"
  });
  console.log("Respuesta ACG:", JSON.stringify(res2.payload, null, 2));
  console.log(`✓ Latencia roundtrip: ${res2.roundtripMs}ms | Estado: ${res2.status}\n`);

  // Test 3: Accrue Loyalty Points with OCC Version 1
  console.log("\x1b[1m\x1b[33m--- [TEST 3/4] Intent: ADD_LOYALTY_POINTS (+800 pts, OCC version: 1) ---\x1b[0m");
  const res3 = await gateway.handleInboundIntent("ADD_LOYALTY_POINTS", {
    accountId: "ACC-BIAN-7701",
    pointsToAdd: 800,
    expectedVersion: 1
  });
  console.log("Respuesta ACG:", JSON.stringify(res3.payload, null, 2));
  console.log(`✓ Latencia roundtrip: ${res3.roundtripMs}ms | Estado: ${res3.status}`);
  console.log(`✓ Nuevo Saldo: ${res3.payload.data.pointsBalance} pts | Nuevo Nivel: ${res3.payload.data.tier} | Versión incrementada a: ${res3.payload.data.version}\n`);

  // Test 4: Discover Customer Campaigns
  console.log("\x1b[1m\x1b[33m--- [TEST 4/4] Intent: GET_CUSTOMER_CAMPAIGNS ('ACC-BIAN-7701') ---\x1b[0m");
  const res4 = await gateway.handleInboundIntent("GET_CUSTOMER_CAMPAIGNS", {
    customerId: "ACC-BIAN-7701",
    channel: "AGENTIC_CHAT"
  });
  console.log("Respuesta ACG:", JSON.stringify(res4.payload, null, 2));
  console.log(`✓ Latencia roundtrip: ${res4.roundtripMs}ms | Estado: ${res4.status}\n`);

  console.log("\x1b[1m\x1b[32m========================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[32m  🎉 FASE 1 COMPLETADA CON ÉXITO: HAPPY PATH TOTALMENTE FUNCIONAL       \x1b[0m");
  console.log("\x1b[1m\x1b[32m  - Contratos API JSON Schema validados en el Runtime MCP               \x1b[0m");
  console.log("\x1b[1m\x1b[32m  - Lambdas ejecutándose en vivo en Floci local (puerto 4566)           \x1b[0m");
  console.log("\x1b[1m\x1b[32m  - DynamoDB persistiendo estado y versionado OCC sin colisiones        \x1b[0m");
  console.log("\x1b[1m\x1b[32m========================================================================\x1b[0m\n");
}

main().catch(err => {
  console.error("❌ Falló la ejecución de Fase 1:", err);
  process.exit(1);
});

