/**
 * TrautsLab OS — OpenAI API LLM Provider
 * Supports gpt-4o, gpt-4o-mini, o3-mini.
 */

import { LLMGenerateOptions, LLMGenerateResult, LLMMessage, LLMProvider, SupportedLLMProvider } from './types.js';

export class OpenAIProvider implements LLMProvider {
  readonly name: SupportedLLMProvider = 'openai';
  readonly defaultModel: string;
  private apiKey: string;
  private baseURL: string;

  constructor(options?: { apiKey?: string; defaultModel?: string; baseURL?: string }) {
    this.apiKey = options?.apiKey || process.env.OPENAI_API_KEY || '';
    this.defaultModel = options?.defaultModel || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.baseURL = options?.baseURL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  async generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const messages: LLMMessage[] = [];
    if (options?.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });
    return this.chat(messages, options);
  }

  async chat(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    if (!this.apiKey) {
      throw new Error('[OpenAIProvider] OPENAI_API_KEY no está configurada.');
    }

    const payload: any = {
      model,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 2048,
      response_format: options?.responseFormat === 'json' ? { type: 'json_object' } : undefined
    };

    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`[OpenAIProvider] Error HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    const content = data.choices?.[0]?.message?.content || '';
    const durationMs = Date.now() - startTime;

    return {
      content,
      provider: 'openai',
      model,
      durationMs,
      tokensUsed: {
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        total: data.usage?.total_tokens || 0
      }
    };
  }
}
