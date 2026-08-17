import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SkillQualityEvaluator } from '../src/evaluator.js';

describe('SkillQualityEvaluator Test Suite', () => {
  const evaluator = new SkillQualityEvaluator();

  it('debe evaluar exitosamente un payload válido de Morning Intel', () => {
    const report = evaluator.evaluateIntelPayload({
      date: '2026-08-17',
      github_trending: [
        { repo: 'nousresearch/hermes', stars: '4.8k' },
        { repo: 'hexgrad/kokoro', stars: '9.1k' },
        { repo: 'deepseek-ai/deepseek-v3', stars: '114k' }
      ],
      hacker_news: [
        { title: 'Apple Tracking debates', points: 456 },
        { title: 'Local LLMs on Apple Silicon', points: 892 }
      ],
      quick_summary_tts: 'Hoy en GitHub destaca Hermes Agent y Kokoro TTS para síntesis de voz rápida.'
    });

    assert.strictEqual(report.passed, true);
    assert.ok(report.score >= 0.85);
    assert.strictEqual(report.metrics.schemaValid, true);
  });

  it('debe penalizar payloads con markdown en el texto de TTS', () => {
    const report = evaluator.evaluateIntelPayload({
      date: '2026-08-17',
      github_trending: [],
      hacker_news: [],
      quick_summary_tts: '**Alerta**: visita [este enlace](https://google.com) para ver *detalles*'
    });

    assert.strictEqual(report.passed, false);
    assert.ok(report.recommendations.length > 0);
  });

  it('debe evaluar un payload válido de Agenda', () => {
    const report = evaluator.evaluateAgendaPayload({
      date: '2026-08-17',
      events_count: 3,
      quick_summary_tts: 'Tu compromiso principal es la reunión de arquitectura a las 11:00 AM.'
    });

    assert.strictEqual(report.passed, true);
    assert.strictEqual(report.metrics.schemaValid, true);
  });
});
