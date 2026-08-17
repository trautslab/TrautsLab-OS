import { VoiceClassification, VoiceTier } from './types.js';

export class VoiceIntentRouter {
  /**
   * Classify transcribed input text into one of the 3 tiers
   */
  async classify(text: string): Promise<VoiceClassification> {
    const normalized = text.toLowerCase().trim();

    // 1. Check for TIER 2: Read-Only Fast Cache Queries first for questions
    const isCalendarRead = 
      /\b(qué tengo|que tengo|qué hay|que hay|cuál es mi agenda|cual es mi agenda|lo más importante|lo mas importante|mis compromisos|mi horario|consultar agenda|ver agenda|revisar agenda|tengo algo hoy)\b/i.test(normalized);

    if (isCalendarRead) {
      return {
        tier: 'TIER_2_CACHE',
        confidence: 0.98,
        target: 'today-agenda',
        rationale: 'Consulta de lectura sobre agenda y compromisos del día. Se atiende leyendo OUTPUT/cache/today-agenda.json.'
      };
    }

    // 2. Check for TIER 1: Calendar Scheduling, Modification & Action Directives
    const isCalendarAction = 
      /\b(agendar|agendando|agéndame|agendame|agenda la|agenda el|agenda una|agenda un|programa|programar|programando|prográmame|pon|poner|crea|crear|añade|añadir|agrega|agregar|cambia|cambiar|cambies|cambiame|mueve|mover|reprograma|reprogramar|pasa|pasar|posterga|postergar|modifica|modificar)\b/i.test(normalized) ||
      (/\b(cena|almuerzo|desayuno|reunion|reunión|meet|call|cita|evento|compromiso|recordatorio)\b/i.test(normalized) && /\b(\d{1,2}(?::\d{2})?|\d{1,2}\s*(?:am|pm|hrs|horas)|a las|tarde|noche|mañana)\b/i.test(normalized)) ||
      /\b(cambies a las|cambia a las|pactada a las|para las)\b/i.test(normalized);

    if (isCalendarAction) {
      return {
        tier: 'TIER_1_SKILL',
        confidence: 0.98,
        target: 'calendar-add-event',
        rationale: 'Coincide con la intención de crear, modificar o reprogramar un evento o compromiso en el calendario.'
      };
    }

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

    // 2. Check for TIER 2: Fast Cache Report Queries (Read-Only)
    if (
      normalized.includes('que tengo en mi agenda') ||
      normalized.includes('que hay en mi agenda') ||
      normalized.includes('mis compromisos') ||
      normalized.includes('mi horario') ||
      normalized.includes('consultar agenda') ||
      normalized.includes('agenda de hoy') ||
      normalized.includes('compromisos de hoy') ||
      normalized.includes('reuniones de hoy') ||
      normalized.includes('que tengo hoy') ||
      (normalized.includes('agenda') && !normalized.includes('agend')) ||
      normalized.includes('calendario')
    ) {
      return {
        tier: 'TIER_2_CACHE',
        confidence: 0.98,
        target: 'today-agenda',
        rationale: 'Consulta de lectura sobre agenda y compromisos del día. Se atiende leyendo OUTPUT/cache/today-agenda.json.'
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
