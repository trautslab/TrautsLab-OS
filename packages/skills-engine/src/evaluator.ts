/**
 * TrautsLab OS — Self-Improving Loops & Skill Quality Evaluator
 * Audits generated outputs, computes quality scores, and refines prompts
 */

export interface QualityReport {
  timestamp: string;
  skillId: string;
  score: number; // 0.0 to 1.0
  passed: boolean;
  metrics: {
    schemaValid: boolean;
    dataCompleteness: number; // 0.0 to 1.0
    ttsPhoneticClarity: number; // 0.0 to 1.0
    freshnessScore: number; // 0.0 to 1.0
  };
  recommendations: string[];
}

export class SkillQualityEvaluator {
  /**
   * Evaluate a Morning Intel Scan output payload
   */
  public evaluateIntelPayload(payload: any): QualityReport {
    const recommendations: string[] = [];
    let completeness = 0;
    let ttsClarity = 0;
    let freshness = 1.0;

    // 1. Schema Validation
    const schemaValid = Boolean(
      payload &&
      payload.date &&
      Array.isArray(payload.github_trending) &&
      Array.isArray(payload.hacker_news) &&
      typeof payload.quick_summary_tts === 'string'
    );

    if (!schemaValid) {
      recommendations.push('El payload no contiene la estructura requerida (date, github_trending, hacker_news, quick_summary_tts).');
    }

    // 2. Data Completeness
    if (schemaValid) {
      const ghCount = payload.github_trending.length;
      const hnCount = payload.hacker_news.length;
      completeness = Math.min(1.0, (ghCount / 3) * 0.5 + (hnCount / 3) * 0.5);

      if (ghCount === 0) recommendations.push('No se extrajeron repositorios de GitHub Trending.');
      if (hnCount === 0) recommendations.push('No se extrajeron noticias de Hacker News.');
    }

    // 3. TTS Phonetic Clarity
    if (payload?.quick_summary_tts) {
      const tts = payload.quick_summary_tts;
      // Penalize markdown symbols or URLs in TTS text
      const hasMarkdown = /[*_#`\[\]]/.test(tts);
      const hasUrls = /https?:\/\//.test(tts);
      const isGoodLength = tts.length >= 20 && tts.length <= 300;

      ttsClarity = (hasMarkdown ? 0.3 : 0.5) + (hasUrls ? 0 : 0.3) + (isGoodLength ? 0.2 : 0);
      if (hasMarkdown) recommendations.push('El resumen TTS contiene símbolos de markdown que deben removerse para locución limpia.');
      if (hasUrls) recommendations.push('El resumen TTS contiene URLs que dificultan la síntesis fonética.');
    } else {
      recommendations.push('Falta el campo quick_summary_tts.');
    }

    const score = schemaValid ? Number(((completeness * 0.4) + (ttsClarity * 0.4) + (freshness * 0.2)).toFixed(2)) : 0;

    return {
      timestamp: new Date().toISOString(),
      skillId: 'morning-intel-scan',
      score,
      passed: score >= 0.75,
      metrics: {
        schemaValid,
        dataCompleteness: completeness,
        ttsPhoneticClarity: ttsClarity,
        freshnessScore: freshness
      },
      recommendations
    };
  }

  /**
   * Evaluate a Calendar Daily Brief output payload
   */
  public evaluateAgendaPayload(payload: any): QualityReport {
    const recommendations: string[] = [];
    const schemaValid = Boolean(
      payload &&
      payload.date &&
      typeof payload.events_count === 'number' &&
      typeof payload.quick_summary_tts === 'string'
    );

    if (!schemaValid) {
      recommendations.push('El payload de agenda no tiene la estructura requerida.');
    }

    const ttsClarity = payload?.quick_summary_tts && payload.quick_summary_tts.length > 10 ? 0.9 : 0.3;
    const score = schemaValid ? Number((0.5 + ttsClarity * 0.5).toFixed(2)) : 0;

    return {
      timestamp: new Date().toISOString(),
      skillId: 'calendar-daily-brief',
      score,
      passed: score >= 0.75,
      metrics: {
        schemaValid,
        dataCompleteness: schemaValid ? 1.0 : 0,
        ttsPhoneticClarity: ttsClarity,
        freshnessScore: 1.0
      },
      recommendations
    };
  }
}
