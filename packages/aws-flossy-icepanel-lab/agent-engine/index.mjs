/**
 * agent-engine/index.mjs
 * Main Orchestrator for the BIAN Squad Ingestion & IcePanel Modeling Engine.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseRawSquadText } from './lib/squad-parser.mjs';
import { matchSquadToBian } from './lib/bian-matcher.mjs';
import { emitIcePanelLandscape, emitMermaidDiagram } from './lib/icepanel-emitter.mjs';
import { emitLikeC4Model } from './lib/likec4-emitter.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPipeline() {
  console.log('================================================================');
  console.log('🚀 AGENT ENGINE: BIAN CORE BANKING TO ICEPANEL ARCHITECTURE LAB');
  console.log('================================================================');

  const rootDir = path.resolve(__dirname, '..');
  const rawPath = path.join(rootDir, 'legacy-squad-dataset/raw-squad-architecture-dump.txt');
  const flowsPath = path.join(rootDir, 'legacy-squad-dataset/squad-flows-catalog.json');
  const artifactsDir = path.join(rootDir, 'artifacts');

  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  // 1. Ingest Raw Architecture Text
  console.log('\n[1/5] Ingesting raw unstructured squad topology...');
  const rawText = fs.readFileSync(rawPath, 'utf-8');
  const parsedManifest = parseRawSquadText(rawText);
  console.log(`  ✓ Ingested ${parsedManifest.domains.length} Domains`);
  console.log(`  ✓ Discovered ${parsedManifest.repositories.length} Repositories`);

  // 2. Correlate with BIAN v10 Semantic Catalog
  console.log('\n[2/5] Correlating with BIAN v10 Core Banking Taxonomy...');
  const enrichedManifest = matchSquadToBian(parsedManifest);
  console.log(`  ✓ Compliance Level: ${enrichedManifest.bianComplianceLevel}`);
  for (const dom of enrichedManifest.domains) {
    console.log(`    - Domain [${dom.bianInfo ? dom.bianInfo.id : 'SD'}]: ${dom.name} (${dom.repoCount} repos)`);
  }

  // 3. Load 20 Core Banking Flows
  console.log('\n[3/5] Loading 20 Core Banking End-to-End Business Flows...');
  const flowsCatalog = JSON.parse(fs.readFileSync(flowsPath, 'utf-8'));
  console.log(`  ✓ Loaded ${flowsCatalog.totalFlows} flows across squad boundaries`);

  // 4. Generate IcePanel Landscape & Mermaid Visualizations
  console.log('\n[4/6] Emitting IcePanel C4 Model & Visual Artifacts...');
  const icepanelLandscape = emitIcePanelLandscape(enrichedManifest, flowsCatalog);
  const mermaidDiagram = emitMermaidDiagram(enrichedManifest, flowsCatalog);

  const landscapePath = path.join(artifactsDir, 'icepanel-landscape-c4.json');
  const mermaidPath = path.join(artifactsDir, 'architecture-c4-model.mermaid');
  fs.writeFileSync(landscapePath, JSON.stringify(icepanelLandscape, null, 2), 'utf-8');
  fs.writeFileSync(mermaidPath, mermaidDiagram, 'utf-8');
  console.log(`  ✓ IcePanel Landscape saved: ${landscapePath}`);
  console.log(`  ✓ Mermaid C4 Model saved:   ${mermaidPath}`);

  // 5. Generate LikeC4 Architecture Model with IcePanel Theme
  console.log('\n[5/6] Emitting LikeC4 Architecture Model (IcePanel-themed DSL)...');
  const likec4Dir = path.join(rootDir, 'likec4/src');
  if (!fs.existsSync(likec4Dir)) {
    fs.mkdirSync(likec4Dir, { recursive: true });
  }
  const likec4Model = emitLikeC4Model(enrichedManifest, flowsCatalog);
  const likec4Path = path.join(likec4Dir, 'architecture.c4');
  fs.writeFileSync(likec4Path, likec4Model, 'utf-8');
  console.log(`  ✓ LikeC4 Model saved:       ${likec4Path}`);

  // 6. Generate Squad Topology Matrix Report
  console.log('\n[6/6] Generating Squad Topology Matrix Report...');
  let matrixMd = `# 📊 Squad Topology & BIAN Traceability Matrix\n\n`;
  matrixMd += `**Squad:** Cuentas & Rieles Transaccionales  \n`;
  matrixMd += `**Total BIAN Domains:** ${enrichedManifest.totalDomains}  \n`;
  matrixMd += `**Total Repositories:** ${enrichedManifest.totalRepositories}  \n`;
  matrixMd += `**Total End-to-End Flows:** ${flowsCatalog.totalFlows}  \n\n`;

  matrixMd += `## Repository Inventory by BIAN Domain\n\n`;
  matrixMd += `| Repo Index | Repository Name | Archetype | BIAN Domain | BIAN Control Record | Technology Stack | AWS Service |\n`;
  matrixMd += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const dom of enrichedManifest.domains) {
    for (const repo of dom.repos) {
      matrixMd += `| ${repo.index} | \`${repo.name}\` | **${repo.archetype}** | ${repo.bianDomainName} | ${repo.bianControlRecord} | ${repo.techStack} | ${repo.awsService} |\n`;
    }
  }

  matrixMd += `\n## End-to-End Flows Summary\n\n`;
  matrixMd += `| Flow ID | Flow Name | Primary Domain | Total Steps |\n`;
  matrixMd += `| :--- | :--- | :--- | :--- |\n`;
  for (const fl of flowsCatalog.flows) {
    matrixMd += `| **${fl.id}** | ${fl.name} | ${fl.primaryDomain} | ${fl.steps.length} steps |\n`;
  }

  const matrixPath = path.join(artifactsDir, 'squad-topology-matrix.md');
  fs.writeFileSync(matrixPath, matrixMd, 'utf-8');
  console.log(`  ✓ Topology Matrix saved:    ${matrixPath}`);

  console.log('\n================================================================');
  console.log('✅ PIPELINE COMPLETE: 11 Domains, 80 Repositories, 20 Flows Modeled!');
  console.log('================================================================\n');
}

runPipeline().catch((err) => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});

