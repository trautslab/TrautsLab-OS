/**
 * TrautsLab OS — Ollama Local LLM Provider
 */

import { LLMGenerateOptions, LLMGenerateResult, LLMMessage, LLMProvider, SupportedLLMProvider } from './types.js';

export class OllamaProvider implements LLMProvider {
  readonly name: SupportedLLMProvider = 'ollama';
  readonly defaultModel: string;
  private endpoint: string;

  constructor(options?: { endpoint?: string; defaultModel?: string }) {
    this.endpoint = options?.endpoint || process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
    this.defaultModel = options?.defaultModel || process.env.OLLAMA_MODEL || 'qwen2.5:3b';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.endpoint}/api/tags`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    const res = await fetch(`${this.endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system: options?.systemPrompt,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.3,
          num_predict: options?.maxTokens ?? 1024
        },
        format: options?.responseFormat === 'json' ? 'json' : undefined
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`[OllamaProvider] Error HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    const durationMs = Date.now() - startTime;

    return {
      content: data.response || '',
      provider: 'ollama',
      model,
      durationMs,
      tokensUsed: {
        prompt: data.prompt_eval_count || 0,
        completion: data.eval_count || 0,
        total: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      }
    };
  }

  async chat(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    const res = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.3,
          num_predict: options?.maxTokens ?? 1024
        },
        format: options?.responseFormat === 'json' ? 'json' : undefined
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`[OllamaProvider] Error HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    const durationMs = Date.now() - startTime;

    return {
      content: data.message?.content || '',
      provider: 'ollama',
      model,
      durationMs,
      tokensUsed: {
        prompt: data.prompt_eval_count || 0,
        completion: data.eval_count || 0,
        total: (data.prompt_eval_count || 0) + (data.eval_count || 0)
      }
    };
  }
}
