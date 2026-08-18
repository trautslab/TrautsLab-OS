import { SkillRegistry, SkillContext, MorningIntelScanSkill, CalendarDailyBriefSkill, CalendarAddEventSkill, CalendarArchiveEventSkill, VaultSyncIndexerSkill } from '@trautslab/skills-engine';
import { Tier2CacheManager } from '@trautslab/vault-engine';
import { FasterWhisperSTTEngine } from './stt-engine.js';
import { KokoroTTSEngine } from './tts-engine.js';
import { VoiceIntentRouter } from './router.js';
import { LLMEngine } from './llm-engine.js';
import { sanitizeTextForSpeech } from './speech-sanitizer.js';
import { globalSessionManager } from './session-manager.js';
import { VoiceSessionInput, VoiceSessionResponse } from './types.js';

export interface VoicePipelineConfig {
  vaultRoot: string;
  sttEndpoint?: string;
  ttsEndpoint?: string;
  ollamaEndpoint?: string;
  modelName?: string;
}

export class VoicePipeline {
  private vaultRoot: string;
  private stt: FasterWhisperSTTEngine;
  private tts: KokoroTTSEngine;
  private router: VoiceIntentRouter;
  private cacheMgr: Tier2CacheManager;
  private skillRegistry: SkillRegistry;
  private llm: LLMEngine;

  constructor(config: VoicePipelineConfig) {
    this.vaultRoot = config.vaultRoot;
    this.stt = new FasterWhisperSTTEngine({ endpointUrl: config.sttEndpoint });
    this.tts = new KokoroTTSEngine({ endpointUrl: config.ttsEndpoint });
    this.router = new VoiceIntentRouter();
    this.cacheMgr = new Tier2CacheManager(this.vaultRoot);
    this.llm = new LLMEngine({
      ollamaEndpoint: config.ollamaEndpoint,
      modelName: config.modelName || 'qwen2.5:7b'
    });

    // Setup skills registry
    this.skillRegistry = new SkillRegistry();
    this.skillRegistry.register(new MorningIntelScanSkill());
    this.skillRegistry.register(new CalendarDailyBriefSkill());
    this.skillRegistry.register(new CalendarAddEventSkill());
    this.skillRegistry.register(new CalendarArchiveEventSkill());
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
          timestamp: new Date(),
          args: {
            query: transcription,
            eventText: transcription
          }
        };
        const result = await this.skillRegistry.execute(skillId, ctx);
        actionMs = Date.now() - actionStart;

        if (result.success) {
          responsePlainText = result.message || `Skill ${skillId} ejecutada exitosamente en ${result.executionTimeMs}ms.`;
          responsePhoneticTts = result.message || `Operación completada con éxito.`;
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
        const prompt = classification.target || transcription;
        console.log(`[VoicePipeline] 🤖 Ejecutando Razonamiento Conversacional LLM (Ollama/Qwen): "${prompt}"`);
        const llmReply = await this.llm.generateResponse(transcription);
        actionMs = Date.now() - actionStart;
        responsePlainText = llmReply;
        responsePhoneticTts = sanitizeTextForSpeech(llmReply);
        break;
      }
    }

    // 3. Ensure Phonetic TTS text is completely clean of Markdown tags
    responsePhoneticTts = sanitizeTextForSpeech(responsePhoneticTts);

    // Audio Synthesis with Kokoro TTS
    const ttsStart = Date.now();
    const ttsResult = await this.tts.synthesize(responsePhoneticTts);
    const ttsMs = Date.now() - ttsStart;

    const totalMs = Date.now() - totalStart;

    // 4. Record into Active Session and Ledger
    globalSessionManager.recordMessage({
      sourceClient: (input.sourceClient as any) || 'global_hotkey',
      sender: 'user',
      type: 'text',
      rawInput: transcription,
      transcription,
      responsePlainText,
      tier: classification.tier,
      latencyMs: totalMs,
      metadata: {
        target: classification.target,
        confidence: classification.confidence
      }
    });

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
