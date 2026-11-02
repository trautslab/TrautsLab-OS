#!/usr/bin/env node
/**
 * bin/run-all-phases.mjs
 * Master Autonomous Execution Orchestrator
 * Sequentially executes, benchmarks, and verifies all 4 phases against Floci local AWS runtime.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FLOCI_ENDPOINT = process.env.FLOCI_ENDPOINT || "http://localhost:4566";

const ddb = new DynamoDBClient({
  endpoint: FLOCI_ENDPOINT,
  region: "us-east-1",
  credentials: { accessKeyId: "mock", secretAccessKey: "mock" }
});

const PHASES = [
  { id: "PHASE_1", name: "Baseline Happy Path & Typed API Contracts", script: "bin/run-phase1-demo.mjs" },
  { id: "PHASE_2", name: "Alternative Paths & Cursor Pagination", script: "bin/run-phase2-demo.mjs" },
  { id: "PHASE_3", name: "Edge Cases, Contract Drift & Circuit Breaker", script: "bin/run-phase3-demo.mjs" },
  { id: "PHASE_4", name: "Shared DynamoDB Table Collision & OCC Auto-Healing", script: "bin/run-phase4-demo.mjs" }
];

async function main() {
  console.log("\x1b[1m\x1b[36m========================================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[36m  🚀 MASTER ORCHESTRATOR: COMPLETE 4-PHASE ENTERPRISE BANKING SUITE (FLOCI RUNTIME)    \x1b[0m");
  console.log("\x1b[1m\x1b[36m========================================================================================\x1b[0m\n");

  const results = [];
  const startTime = Date.now();

  for (const phase of PHASES) {
    console.log(`\n\x1b[1m\x1b[34m>>> EXECUTING ${phase.id}: ${phase.name} <<<\x1b[0m`);
    const phaseStart = Date.now();
    try {
      const output = execSync(`node ${phase.script}`, {
        cwd: ROOT,
        stdio: "pipe",
        encoding: "utf8"
      });
      const durationMs = Date.now() - phaseStart;
      console.log(output);
      console.log(`\x1b[32m✓ ${phase.id} COMPLETED SUCCESSFULLY in ${durationMs}ms\x1b[0m\n`);
      results.push({ phase: phase.id, name: phase.name, status: "PASSED", durationMs });
    } catch (err) {
      const durationMs = Date.now() - phaseStart;
      console.error(`\x1b[31m❌ ${phase.id} FAILED:\x1b[0m`, err.stdout || err.message);
      results.push({ phase: phase.id, name: phase.name, status: "FAILED", durationMs, error: err.message });
      process.exit(1);
    }
  }

  // Verify CQRS Audit Trail in DynamoDB
  console.log("\x1b[1m\x1b[35m>>> VERIFYING CQRS PROJECTION AUDIT TRAIL ('core-transactions-history-local') <<<\x1b[0m");
  const scanRes = await ddb.send(new ScanCommand({
    TableName: "core-transactions-history-local"
  }));
  const txCount = scanRes.Items ? scanRes.Items.length : 0;
  console.log(`✓ Eventos de auditoría CQRS registrados en DynamoDB: \x1b[1m\x1b[32m${txCount} transacciones\x1b[0m`);
  if (scanRes.Items && scanRes.Items.length > 0) {
    scanRes.Items.slice(0, 3).forEach((item, idx) => {
      console.log(`   [TX ${idx+1}] Account: ${item.accountId?.S} | Type: ${item.transactionType?.S} | Amount: ${item.amount?.N} | Timestamp: ${item.transactionTimestamp?.N}`);
    });
  }

  const totalDurationMs = Date.now() - startTime;
  const metrics = {
    executedAt: new Date().toISOString(),
    flociEndpoint: FLOCI_ENDPOINT,
    totalDurationMs,
    allPassed: results.every(r => r.status === "PASSED"),
    cqrsAuditEventsRecorded: txCount,
    phases: results
  };

  const metricsPath = path.join(ROOT, "artifacts/phase-execution-metrics.json");
  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));

  console.log("\n\x1b[1m\x1b[32m========================================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[32m  🏆 EXECUTIVE SCORECARD: ALL 4 PHASES 100% OPERATIONAL IN FLOCI AWS RUNTIME           \x1b[0m");
  console.log("\x1b[1m\x1b[32m========================================================================================\x1b[0m");
  console.table(results.map(r => ({
    "Fase": r.phase,
    "Nombre del Hito": r.name,
    "Estado": r.status === "PASSED" ? "✅ PASSED" : "❌ FAILED",
    "Duración (ms)": `${r.durationMs}ms`
  })));
  console.log(`\n📊 Telemetría y métricas persistidas en: \x1b[33m${metricsPath}\x1b[0m`);
  console.log(`⏱️  Duración total del pipeline: \x1b[1m${totalDurationMs}ms\x1b[0m\n`);
}

main().catch(err => {
  console.error("❌ Error en Master Orchestrator:", err);
  process.exit(1);
});
