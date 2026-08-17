#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs/promises';
import { resolveVaultRoot } from '@trautslab/vault-engine';
import { SkillRegistry } from './registry.js';
import { SkillScheduler } from './scheduler.js';
import { LaunchdGenerator } from './launchd-generator.js';
import { MorningIntelScanSkill } from './skills/morning-intel-scan.js';
import { CalendarDailyBriefSkill } from './skills/calendar-daily-brief.js';
import { VaultSyncIndexerSkill } from './skills/vault-sync-indexer.js';
import { SkillContext } from './types.js';

const command = process.argv[2] || 'list';
let customVault = '';

if (command === 'run') {
  if (process.argv[4]) {
    customVault = process.argv[4];
  }
} else if (process.argv[3] && !process.argv[3].startsWith('--')) {
  customVault = process.argv[3];
}

const targetVault = resolveVaultRoot(customVault);

// Setup registry & skills
const registry = new SkillRegistry();
registry.register(new MorningIntelScanSkill());
registry.register(new CalendarDailyBriefSkill());
registry.register(new VaultSyncIndexerSkill());

async function main() {
  console.log(`\n⚡ [TrautsLab OS — Skills & Automation Engine]`);
  console.log(`📁 Vault Root: ${targetVault}\n`);

  switch (command) {
    case 'list': {
      console.log('📋 Lista de Habilidades Registradas:');
      const skills = registry.list();
      skills.forEach(s => {
        const cronStr = s.metadata.cronSchedule ? `[Cron: ${s.metadata.cronSchedule}]` : '[Manual]';
        console.log(`  • ${s.metadata.id.padEnd(22)} | ${s.metadata.domain.padEnd(14)} | ${cronStr.padEnd(18)} | ${s.metadata.name}`);
      });
      console.log(`\nTotal: ${skills.length} habilidades disponibles.`);
      break;
    }

    case 'run': {
      const skillId = process.argv[3] || 'morning-intel-scan';
      const actualVault = process.argv[4] ? path.resolve(process.argv[4]) : targetVault;
      
      const ctx: SkillContext = {
        vaultRoot: actualVault,
        timestamp: new Date()
      };

      const result = await registry.execute(skillId, ctx);
      console.log('\nResultado de la Ejecución:');
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'cron': {
      console.log('⏰ Iniciando demonio de automatizaciones en primer plano...');
      const scheduler = new SkillScheduler(registry, targetVault);
      scheduler.start();

      process.on('SIGINT', () => {
        console.log('\nDeteniendo planificador...');
        scheduler.stop();
        process.exit(0);
      });
      break;
    }

    case 'generate-plist': {
      const projectRoot = path.resolve(process.cwd(), '../../');
      const plistContent = LaunchdGenerator.generatePlist(projectRoot);
      const outputPath = path.join(process.cwd(), 'com.trautslab.os.scheduler.plist');
      await fs.writeFile(outputPath, plistContent, 'utf-8');
      console.log(`✓ Archivo LaunchAgent generado en:\n  ${outputPath}`);
      console.log(`\nPara activarlo en macOS:`);
      console.log(`  cp ${outputPath} ~/Library/LaunchAgents/`);
      console.log(`  launchctl load ~/Library/LaunchAgents/com.trautslab.os.scheduler.plist\n`);
      break;
    }

    default:
      console.log('Comandos disponibles: list | run <skillId> | cron | generate-plist');
  }
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
