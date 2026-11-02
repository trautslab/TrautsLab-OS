/**
 * squad-parser.mjs
 * Parses raw architectural squad dumps and maps them into canonical BIAN-aligned models.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function parseRawSquadText(rawText) {
  const lines = rawText.split('\n');
  const domains = [];
  const repositories = [];
  let currentDomain = null;

  const domainRegex = /---\s*DOMAIN\s*(\d+):\s*([^(]+)\s*(?:\((\d+)\s*REPOSITORIES\))?\s*---/i;
  const repoRegex = /^(\d+)\.\s*([a-z0-9-]+)\s*\(Archetype:\s*([^)]+)\):\s*(.+)$/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('===')) continue;

    const domainMatch = trimmed.match(domainRegex);
    if (domainMatch) {
      currentDomain = {
        domainIndex: parseInt(domainMatch[1], 10),
        name: domainMatch[2].trim(),
        repoCountExpected: domainMatch[3] ? parseInt(domainMatch[3], 10) : 0,
        repos: []
      };
      domains.push(currentDomain);
      continue;
    }

    const repoMatch = trimmed.match(repoRegex);
    if (repoMatch) {
      const index = parseInt(repoMatch[1], 10);
      const name = repoMatch[2].trim();
      const archetype = repoMatch[3].trim();
      const descriptionFull = repoMatch[4].trim();

      // Extract tech stack if present
      let description = descriptionFull;
      let techStack = 'AWS Lambda, Node.js';
      const techMatch = descriptionFull.match(/Tech:\s*([^.]+)/i);
      if (techMatch) {
        techStack = techMatch[1].trim();
        description = descriptionFull.replace(/Tech:\s*[^.]+\.?/i, '').trim();
      }

      // Determine AWS Service representation
      let awsService = 'AWS Lambda';
      if (archetype.toLowerCase().includes('step function')) {
        awsService = 'AWS Step Functions';
      } else if (archetype.toLowerCase().includes('alarms')) {
        awsService = 'Amazon CloudWatch Alarms';
      } else if (archetype.toLowerCase().includes('eventbridge')) {
        awsService = 'Amazon EventBridge';
      } else if (techStack.toLowerCase().includes('ecs') || techStack.toLowerCase().includes('container')) {
        awsService = 'Amazon ECS Fargate';
      }

      const repo = {
        id: `REPO-${String(index).padStart(3, '0')}`,
        index,
        name,
        archetype,
        domain: currentDomain ? currentDomain.name : 'Unknown',
        domainIndex: currentDomain ? currentDomain.domainIndex : 0,
        description,
        techStack,
        awsService,
        tags: [
          `archetype:${archetype.toLowerCase().replace(/\s+/g, '-')}`,
          `domain:${currentDomain ? currentDomain.name.toLowerCase().replace(/\s+/g, '-') : 'general'}`,
          'cloud:aws',
          'squad:core-banking'
        ]
      };

      if (currentDomain) {
        currentDomain.repos.push(repo);
      }
      repositories.push(repo);
    }
  }

  return { domains, repositories };
}

// CLI self-runner
if (process.argv[1] === __filename) {
  const rawPath = path.resolve(__dirname, '../../legacy-squad-dataset/raw-squad-architecture-dump.txt');
  const rawText = fs.readFileSync(rawPath, 'utf-8');
  const parsed = parseRawSquadText(rawText);
  console.log(`Parsed ${parsed.domains.length} domains and ${parsed.repositories.length} repositories.`);
  
  const manifestPath = path.resolve(__dirname, '../../legacy-squad-dataset/squad-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(parsed, null, 2), 'utf-8');
  console.log(`Saved manifest to ${manifestPath}`);
}

