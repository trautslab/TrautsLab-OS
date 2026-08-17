import cron from 'node-cron';
import { SkillRegistry } from './registry.js';
import { SkillContext } from './types.js';

export class SkillScheduler {
  private registry: SkillRegistry;
  private vaultRoot: string;
  private tasks: cron.ScheduledTask[] = [];

  constructor(registry: SkillRegistry, vaultRoot: string) {
    this.registry = registry;
    this.vaultRoot = vaultRoot;
  }

  /**
   * Start scheduling all registered skills with a cronSchedule defined
   */
  start(): void {
    console.log(`\n⏰ [SkillScheduler] Inicializando planificador de automatizaciones (Crons)...`);
    const skills = this.registry.list();

    for (const skill of skills) {
      if (skill.metadata.cronSchedule) {
        const schedule = skill.metadata.cronSchedule;
        console.log(`  └─ Registrando Cron [${schedule}] &rarr; ${skill.metadata.id} (${skill.metadata.name})`);

        const task = cron.schedule(schedule, async () => {
          console.log(`\n[CronTrigger: ${new Date().toISOString()}] Disparando skill: ${skill.metadata.id}`);
          const ctx: SkillContext = {
            vaultRoot: this.vaultRoot,
            timestamp: new Date()
          };
          await this.registry.execute(skill.metadata.id, ctx);
        });

        this.tasks.push(task);
      }
    }

    console.log(`✓ [SkillScheduler] ${this.tasks.length} automatizaciones programadas activas.`);
  }

  stop(): void {
    this.tasks.forEach(t => t.stop());
    this.tasks = [];
    console.log(`[SkillScheduler] Planificador detenido.`);
  }
}
