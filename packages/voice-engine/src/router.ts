/**
 * TrautsLab OS — Pure LLM Semantic Intent Router
 * The LLM is the single source of truth for all intent classification, parameter extraction,
 * and skill execution decisions without hardcoded regexes.
 */

import { VoiceClassification, VoiceTier } from './types.js';
import { LLMIntentRouter, LLMIntentResult } from './llm-router.js';
import { SkillRegistry } from '@trautslab/skills-engine';

export class VoiceIntentRouter {
  private llmRouter: LLMIntentRouter;
  private skillRegistry?: SkillRegistry;

  constructor(skillRegistry?: SkillRegistry, llmRouter?: LLMIntentRouter) {
    this.skillRegistry = skillRegistry;
    this.llmRouter = llmRouter || new LLMIntentRouter();
  }

  /**
   * Semantically classifies user query using LLM as the sole authority
   */
  async classify(text: string): Promise<VoiceClassification & { parameters?: any }> {
    const rawInput = text.trim();
    if (!rawInput) {
      return {
        tier: 'TIER_3_HEADLESS',
        confidence: 1.0,
        target: 'general_chat',
        rationale: 'Entrada vacía'
      };
    }

    try {
      // 1. Dynamic Tool Reasoning: Query the LLM with the list of registered skills
      const availableSkills = this.skillRegistry?.list();
      const llmResult = await this.llmRouter.classify(rawInput, availableSkills);

      if (llmResult && llmResult.intent) {
        // Tier 1: Skill Invocation
        if (llmResult.tier === 'TIER_1_SKILL' || (this.skillRegistry && this.skillRegistry.get(llmResult.intent))) {
          return {
            tier: 'TIER_1_SKILL',
            confidence: llmResult.confidence || 0.95,
            target: llmResult.intent,
            rationale: llmResult.reasoning || `Habilidad '${llmResult.intent}' seleccionada por el LLM.`,
            parameters: llmResult.parameters
          };
        }

        // Tier 2: Cache Read
        if (llmResult.tier === 'TIER_2_CACHE' || llmResult.intent.startsWith('today-')) {
          return {
            tier: 'TIER_2_CACHE',
            confidence: llmResult.confidence || 0.95,
            target: llmResult.intent,
            rationale: llmResult.reasoning || 'Consulta rápida a caché leída por el LLM.',
            parameters: llmResult.parameters
          };
        }

        // Tier 3: Conversational LLM
        return {
          tier: 'TIER_3_HEADLESS',
          confidence: llmResult.confidence || 0.9,
          target: rawInput,
          rationale: llmResult.reasoning || 'Conversación general resuelta por razonamiento conversacional.',
          parameters: llmResult.parameters
        };
      }
    } catch (err: any) {
      console.warn('[VoiceIntentRouter] Error en enrutador semántico LLM:', err.message);
    }

    // 2. Safe Fallback: Default to Conversational LLM (Tier 3)
    return {
      tier: 'TIER_3_HEADLESS',
      confidence: 0.85,
      target: rawInput,
      rationale: 'Enrutado a procesamiento conversacional por LLM.'
    };
  }
}
