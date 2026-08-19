/**
 * TrautsLab OS — Anthropic Claude API LLM Provider
 * Supports claude-3-5-sonnet, claude-3-5-haiku.
 */

import { LLMGenerateOptions, LLMGenerateResult, LLMMessage, LLMProvider, SupportedLLMProvider } from './types.js';

export class ClaudeProvider implements LLMProvider {
  readonly name: SupportedLLMProvider = 'anthropic';
  readonly defaultModel: string;
  private apiKey: string;

  constructor(options?: { apiKey?: string; defaultModel?: string }) {
    this.apiKey = options?.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.defaultModel = options?.defaultModel || process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  async generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const messages: LLMMessage[] = [{ role: 'user', content: prompt }];
    return this.chat(messages, options);
  }

  async chat(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    if (!this.apiKey) {
      throw new Error('[ClaudeProvider] ANTHROPIC_API_KEY no está configurada.');
    }

    const systemMsg = messages.find((m) => m.role === 'system');
    const system = options?.systemPrompt || systemMsg?.content;

    const userAndAssistantMsgs = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    const payload: any = {
      model,
      messages: userAndAssistantMsgs,
      max_tokens: options?.maxTokens ?? 2048,
      temperature: options?.temperature ?? 0.3
    };

    if (system) {
      payload.system = system;
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`[ClaudeProvider] Error HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    const content = data.content?.[0]?.text || '';
    const durationMs = Date.now() - startTime;

    return {
      content,
      provider: 'anthropic',
      model,
      durationMs,
      tokensUsed: {
        prompt: data.usage?.input_tokens || 0,
        completion: data.usage?.output_tokens || 0,
        total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      }
    };
  }
}
