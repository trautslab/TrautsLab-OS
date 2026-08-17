import { VoiceClassification, VoiceTier } from './types.js';

export class VoiceIntentRouter {
  /**
   * Classify transcribed input text into one of the 3 tiers
   */
  async classify(text: string): Promise<VoiceClassification> {
    const normalized = text.toLowerCase().trim();

    // 1. Check for TIER 1: Direct Skill Commands
    if (
      normalized.includes('ejecuta el escaneo') ||
      normalized.includes('corre el escaneo') ||
      normalized.includes('ejecutar escaneo') ||
      normalized.includes('morning intel') ||
      normalized.includes('escanear noticias')
    ) {
      return {
        tier: 'TIER_1_SKILL',
        confidence: 0.95,
        target: 'morning-intel-scan',
        rationale: 'Coincide con la orden directa de ejecutar el escaneo de inteligencia matutino.'
      };
    }

    if (
      normalized.includes('actualiza el calendario') ||
      normalized.includes('sincronizar calendario') ||
      normalized.includes('actualizar agenda')
    ) {
      return {
        tier: 'TIER_1_SKILL',
        confidence: 0.92,
        target: 'calendar-daily-brief',
        rationale: 'Coincide con la orden de actualizar el briefing de agenda.'
      };
    }

    if (
      normalized.includes('reindexar vault') ||
      normalized.includes('indexa el vault') ||
      normalized.includes('actualiza los indices')
    ) {
      return {
        tier: 'TIER_1_SKILL',
        confidence: 0.96,
        target: 'vault-sync-indexer',
        rationale: 'Coincide con la orden de reconstruir índices del Vault.'
      };
    }

    // 2. Check for TIER 2: Fast Cache Report Queries (Zero-LLM synthesis latency)
    if (
      normalized.includes('agenda') ||
      normalized.includes('calendario') ||
      normalized.includes('compromiso') ||
      normalized.includes('reunion') ||
      normalized.includes('que tengo hoy') ||
      normalized.includes('horario')
    ) {
      return {
        tier: 'TIER_2_CACHE',
        confidence: 0.98,
        target: 'today-agenda',
        rationale: 'Consulta sobre agenda y compromisos del día. Se atiende leyendo OUTPUT/cache/today-agenda.json.'
      };
    }

    if (
      normalized.includes('noticia') ||
      normalized.includes('noticias') ||
      normalized.includes('trending') ||
      normalized.includes('tendencias') ||
      normalized.includes('github') ||
      normalized.includes('hacker news') ||
      normalized.includes('ia de hoy') ||
      normalized.includes('titulares')
    ) {
      return {
        tier: 'TIER_2_CACHE',
        confidence: 0.97,
        target: 'today-intel',
        rationale: 'Consulta de inteligencia/noticias matutinas. Se atiende leyendo OUTPUT/cache/today-intel.json.'
      };
    }

    // 3. Fallback / Complex Goal: TIER 3: Headless Autonomous Agent
    return {
      tier: 'TIER_3_HEADLESS',
      confidence: 0.85,
      target: text,
      rationale: 'La consulta requiere investigación profunda, planificación o modificaciones de código mediante un agente CLI desatendido.'
    };
  }
}
