#!/usr/bin/env node
/**
 * bin/run-squad-ingestion.mjs
 * CLI executable for running the agent ingestion and IcePanel C4 modeling pipeline.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptPath = path.resolve(__dirname, '../agent-engine/index.mjs');

const child = spawn(process.execPath, [scriptPath], {
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

