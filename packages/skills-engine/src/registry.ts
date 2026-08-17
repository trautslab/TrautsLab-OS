import { Skill, SkillContext, SkillResult } from './types.js';

export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();

  register(skill: Skill): void {
    if (this.skills.has(skill.metadata.id)) {
      console.warn(`[SkillRegistry] Sobrescribiendo skill ya registrada: ${skill.metadata.id}`);
    }
    this.skills.set(skill.metadata.id, skill);
    console.log(`[SkillRegistry] ✓ Registrada skill: ${skill.metadata.id} (${skill.metadata.name})`);
  }

  get(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  list(): Skill[] {
    return Array.from(this.skills.values());
  }

  async execute(id: string, ctx: SkillContext): Promise<SkillResult> {
    const skill = this.get(id);
    if (!skill) {
      return {
        success: false,
        skillId: id,
        executionTimeMs: 0,
        message: `La skill '${id}' no se encuentra registrada en el sistema.`,
        error: 'SKILL_NOT_FOUND'
      };
    }

    const start = Date.now();
    console.log(`\n⚡ [SkillRegistry] Ejecutando skill: ${skill.metadata.name} (${id})...`);

    try {
      const result = await skill.execute(ctx);
      const executionTimeMs = Date.now() - start;
      console.log(`✓ [SkillRegistry] Skill '${id}' finalizada en ${executionTimeMs}ms con éxito.`);
      return {
        ...result,
        executionTimeMs
      };
    } catch (err: unknown) {
      const executionTimeMs = Date.now() - start;
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [SkillRegistry] Error ejecutando skill '${id}':`, err);
      return {
        success: false,
        skillId: id,
        executionTimeMs,
        message: `Falló la ejecución de la skill '${id}'.`,
        error: errorMsg
      };
    }
  }
}
