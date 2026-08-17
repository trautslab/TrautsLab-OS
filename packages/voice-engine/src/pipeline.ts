import { SkillRegistry, SkillContext, MorningIntelScanSkill, CalendarDailyBriefSkill, VaultSyncIndexerSkill } from '@trautslab/skills-engine';
import { Tier2CacheManager } from '@trautslab/vault-engine';
import { FasterWhisperSTTEngine } from './stt-engine.js';
import { KokoroTTSEngine } from './tts-engine.js';
import { VoiceIntentRouter } from './router.js';
import { VoiceSessionInput, VoiceSessionResponse } from './types.js';

export interface VoicePipelineConfig {
  vaultRoot: string;
  sttEndpoint?: string;
  ttsEndpoint?: string;
}

export class VoicePipeline {
  private vaultRoot: string;
  private stt: FasterWhisperSTTEngine;
  private tts: KokoroTTSEngine;
  private router: VoiceIntentRouter;
  private cacheMgr: Tier2CacheManager;
  private skillRegistry: SkillRegistry;

  constructor(config: VoicePipelineConfig) {
    this.vaultRoot = config.vaultRoot;
    this.stt = new FasterWhisperSTTEngine({ endpointUrl: config.sttEndpoint });
    this.tts = new KokoroTTSEngine({ endpointUrl: config.ttsEndpoint });
    this.router = new VoiceIntentRouter();
    this.cacheMgr = new Tier2CacheManager(this.vaultRoot);

    // Setup skills registry
    this.skillRegistry = new SkillRegistry();
    this.skillRegistry.register(new MorningIntelScanSkill());
    this.skillRegistry.register(new CalendarDailyBriefSkill());
    this.skillRegistry.register(new VaultSyncIndexerSkill());
  }

  /**
   * Process a complete text query or transcribed input through the 3-Tier Pipeline
   */
  async processQuery(input: VoiceSessionInput): Promise<VoiceSessionResponse> {
    const totalStart = Date.now();
    const transcription = input.transcription.trim();

    // 1. Brain Routing
    const routerStart = Date.now();
    const classification = await this.router.classify(transcription);
    const routerMs = Date.now() - routerStart;

    let responsePlainText = '';
    let responsePhoneticTts = '';
    let actionMs = 0;

    // 2. Action execution based on Tier
    const actionStart = Date.now();

    switch (classification.tier) {
      case 'TIER_1_SKILL': {
        const skillId = classification.target;
        console.log(`[VoicePipeline] ⚡ Ejecutando Skill Tier 1: ${skillId}`);
        const ctx: SkillContext = {
          vaultRoot: this.vaultRoot,
          timestamp: new Date()
        };
        const result = await this.skillRegistry.execute(skillId, ctx);
        actionMs = Date.now() - actionStart;

        if (result.success) {
          responsePlainText = `Skill ${skillId} ejecutada exitosamente en ${result.executionTimeMs}ms.`;
          responsePhoneticTts = `He ejecutado el escaneo matutino con éxito. Los reportes ya están guardados en tu Vault.`;
        } else {
          responsePlainText = `Error ejecutando skill ${skillId}: ${result.error}`;
          responsePhoneticTts = `Hubo un inconveniente al ejecutar la habilidad. Por favor revisa los logs.`;
        }
        break;
      }

      case 'TIER_2_CACHE': {
        const cacheKey = classification.target;
        console.log(`[VoicePipeline] 📑 Consultando Caché Tier 2: ${cacheKey}`);
        const snippet = await this.cacheMgr.getTtsSnippet(cacheKey);
        actionMs = Date.now() - actionStart;

        if (snippet) {
          responsePlainText = snippet;
          responsePhoneticTts = snippet;
        } else {
          responsePlainText = `No se encontró información en caché para la clave ${cacheKey}.`;
          responsePhoneticTts = `No tengo datos guardados de ${cacheKey} para el día de hoy.`;
        }
        break;
      }

      case 'TIER_3_HEADLESS': {
        const prompt = classification.target;
        console.log(`[VoicePipeline] 🤖 Lanzando Agente Headless Tier 3: "${prompt}"`);
        // Simulating async headless agent launch
        actionMs = Date.now() - actionStart;
        responsePlainText = `Agente headless lanzado en segundo plano para procesar: "${prompt}".`;
        responsePhoneticTts = `He iniciado el agente en segundo plano para trabajar en tu solicitud. Te notificaré al terminar.`;
        break;
      }
    }

    // 3. Audio Synthesis with Kokoro TTS
    const ttsStart = Date.now();
    const ttsResult = await this.tts.synthesize(responsePhoneticTts);
    const ttsMs = Date.now() - ttsStart;

    const totalMs = Date.now() - totalStart;

    return {
      inputTranscription: transcription,
      tier: classification.tier,
      target: classification.target,
      responsePlainText,
      responsePhoneticTts,
      audioBuffer: ttsResult.audioBuffer,
      latencies: {
        sttMs: 0,
        routerMs,
        actionMs,
        ttsMs,
        totalMs
      },
      metadata: {
        rationale: classification.rationale,
        confidence: classification.confidence
      }
    };
  }

  /**
   * Process raw audio buffer input
   */
  async processAudio(audioBuffer: Buffer): Promise<VoiceSessionResponse> {
    const sttResult = await this.stt.transcribe(audioBuffer);
    const response = await this.processQuery({ transcription: sttResult.text });
    response.latencies.sttMs = sttResult.latencyMs;
    response.latencies.totalMs += sttResult.latencyMs;
    return response;
  }
}
