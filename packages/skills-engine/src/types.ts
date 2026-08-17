export type SkillDomain = 'productivity' | 'research' | 'ai-systems' | 'operations' | 'content';

export interface SkillMetadata {
  id: string;
  name: string;
  domain: SkillDomain;
  description: string;
  cronSchedule?: string; // e.g. "0 8 * * *" (8:00 AM)
  tier: 1 | 2 | 3;
}

export interface SkillContext {
  vaultRoot: string;
  timestamp: Date;
  args?: Record<string, unknown>;
}

export interface SkillResult {
  success: boolean;
  skillId: string;
  executionTimeMs: number;
  message: string;
  artifactsCreated?: string[];
  cacheKeysUpdated?: string[];
  error?: string;
}

export interface Skill {
  metadata: SkillMetadata;
  execute(ctx: SkillContext): Promise<SkillResult>;
}
