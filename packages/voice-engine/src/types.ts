export type VoiceTier = 'TIER_1_SKILL' | 'TIER_2_CACHE' | 'TIER_3_HEADLESS';

export interface VoiceClassification {
  tier: VoiceTier;
  confidence: number;
  target: string; // Skill ID (Tier 1), Cache Key (Tier 2), or Agent Prompt (Tier 3)
  rationale: string;
}

export interface VoiceSessionInput {
  transcription: string;
  audioDurationMs?: number;
  sourceClient?: 'obsidian' | 'web_pwa' | 'global_hotkey' | 'telegram';
}

export interface VoiceSessionResponse {
  inputTranscription: string;
  tier: VoiceTier;
  target: string;
  responsePlainText: string;
  responsePhoneticTts: string;
  audioBuffer?: Buffer;
  latencies: {
    sttMs: number;
    routerMs: number;
    actionMs: number;
    ttsMs: number;
    totalMs: number;
  };
  metadata?: Record<string, unknown>;
}

export interface STTEngine {
  transcribe(audioBuffer: Buffer): Promise<{ text: string; latencyMs: number }>;
}

export interface TTSEngine {
  synthesize(text: string, voice?: string): Promise<{ audioBuffer: Buffer; latencyMs: number }>;
}
