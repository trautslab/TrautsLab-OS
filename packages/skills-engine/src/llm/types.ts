/**
 * TrautsLab OS — Multi-LLM Provider Abstraction Layer
 * Supports local-first (Ollama) and commercial SaaS APIs (Google Gemini, OpenAI, Anthropic Claude).
 */

export type SupportedLLMProvider = 'ollama' | 'gemini' | 'openai' | 'anthropic';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json';
  systemPrompt?: string;
}

export interface LLMGenerateResult {
  content: string;
  provider: SupportedLLMProvider;
  model: string;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  durationMs: number;
}

export interface LLMProvider {
  readonly name: SupportedLLMProvider;
  readonly defaultModel: string;
  generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMGenerateResult>;
  chat(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<LLMGenerateResult>;
  isAvailable(): Promise<boolean>;
}
