#!/usr/bin/env node
/**
 * bin/deploy-floci-lambdas.mjs
 * Deploys the real domain Lambdas directly to the Floci local AWS runtime.
 */

import { LambdaClient, CreateFunctionCommand, UpdateFunctionCodeCommand, GetFunctionCommand } from "@aws-sdk/client-lambda";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FLOCI_ENDPOINT = process.env.FLOCI_ENDPOINT || "http://localhost:4566";
const REGION = "us-east-1";
const CREDENTIALS = { accessKeyId: "mock", secretAccessKey: "mock" };

const lambda = new LambdaClient({
  endpoint: FLOCI_ENDPOINT,
  region: REGION,
  credentials: CREDENTIALS
});

const LAMBDAS = [
  {
    name: "lmb-matrix-findby-id-coupons-qry-svc-01",
    srcDir: path.join(ROOT, "src/lambdas/lmb-coupons-by-id"),
    description: "Query finder service for coupon details by ID"
  },
  {
    name: "lmb-io-acse-reward-point-acc-qry_findby-01",
    srcDir: path.join(ROOT, "src/lambdas/lmb-reward-point-acc"),
    description: "Loyalty rewards account and balance finder with OCC"
  },
  {
    name: "lmb-io-sale-cust-cpgn-ex-qry_findby-01",
    srcDir: path.join(ROOT, "src/lambdas/lmb-sale-cust-cpgn"),
    description: "Customer campaign execution query finder"
  }
];

async function deploy() {
  console.log("\x1b[1m\x1b[36m========================================================================\x1b[0m");
  console.log("\x1b[1m\x1b[36m  📦 DEPLOYING REAL DOMAIN LAMBDAS TO FLOCI LOCAL RUNTIME             \x1b[0m");
  console.log("\x1b[1m\x1b[36m========================================================================\x1b[0m");
  console.log(`📡 Floci endpoint: ${FLOCI_ENDPOINT}\n`);

  for (const fn of LAMBDAS) {
    console.log(`⚙️  Packaging \x1b[33m${fn.name}\x1b[0m...`);
    const zipPath = path.join("/tmp", `${fn.name}.zip`);
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

    execSync(`cd "${fn.srcDir}" && zip -q -r "${zipPath}" index.js`);
    const zipBuffer = fs.readFileSync(zipPath);

    let exists = false;
    try {
      await lambda.send(new GetFunctionCommand({ FunctionName: fn.name }));
      exists = true;
    } catch (e) {
      exists = false;
    }

    if (exists) {
      console.log(`   -> Updating function code for ${fn.name}...`);
      await lambda.send(new UpdateFunctionCodeCommand({
        FunctionName: fn.name,
        ZipFile: zipBuffer
      }));
      console.log(`   ✓ Updated function ${fn.name}`);
    } else {
      console.log(`   -> Creating new function ${fn.name}...`);
      await lambda.send(new CreateFunctionCommand({
        FunctionName: fn.name,
        Runtime: "nodejs20.x",
        Role: "arn:aws:iam::000000000000:role/lmb-execution-role",
        Handler: "index.handler",
        Description: fn.description,
        Code: { ZipFile: zipBuffer },
        Environment: {
          Variables: {
            FLOCI_ENDPOINT: "http://localhost:4566",
            ACCOUNTS_TABLE: "core-accounts-master-local"
          }
        }
      }));
      console.log(`   ✓ Created function ${fn.name}`);
    }
  }

  console.log("\n\x1b[1m\x1b[32m✅ All Lambdas successfully deployed to Floci!\x1b[0m\n");
}

deploy().catch(err => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});

