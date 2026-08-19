/**
 * TrautsLab OS — Google Gemini API LLM Provider
 * Supports gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash with JSON mode & system instructions.
 */

import { LLMGenerateOptions, LLMGenerateResult, LLMMessage, LLMProvider, SupportedLLMProvider } from './types.js';

export class GeminiProvider implements LLMProvider {
  readonly name: SupportedLLMProvider = 'gemini';
  readonly defaultModel: string;
  private apiKey: string;

  constructor(options?: { apiKey?: string; defaultModel?: string }) {
    this.apiKey = options?.apiKey || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '';
    this.defaultModel = options?.defaultModel || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  async generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    if (!this.apiKey) {
      throw new Error('[GeminiProvider] GOOGLE_AI_API_KEY no está configurada.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const contents: any[] = [];
    if (options?.systemPrompt) {
      // In Gemini API, systemInstruction is supported
    }
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const payload: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 2048,
        responseMimeType: options?.responseFormat === 'json' ? 'application/json' : 'text/plain'
      }
    };

    if (options?.systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: options.systemPrompt }]
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`[GeminiProvider] Error HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const durationMs = Date.now() - startTime;

    return {
      content: text,
      provider: 'gemini',
      model,
      durationMs,
      tokensUsed: {
        prompt: data.usageMetadata?.promptTokenCount || 0,
        completion: data.usageMetadata?.candidatesTokenCount || 0,
        total: data.usageMetadata?.totalTokenCount || 0
      }
    };
  }

  async chat(messages: LLMMessage[], options?: LLMGenerateOptions): Promise<LLMGenerateResult> {
    const startTime = Date.now();
    const model = options?.model || this.defaultModel;

    if (!this.apiKey) {
      throw new Error('[GeminiProvider] GOOGLE_AI_API_KEY no está configurada.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    const systemMsg = messages.find((m) => m.role === 'system');
    const systemPrompt = options?.systemPrompt || systemMsg?.content;

    const payload: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 2048,
        responseMimeType: options?.responseFormat === 'json' ? 'application/json' : 'text/plain'
      }
    };

    if (systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: systemPrompt }]
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`[GeminiProvider] Error HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const durationMs = Date.now() - startTime;

    return {
      content: text,
      provider: 'gemini',
      model,
      durationMs,
      tokensUsed: {
        prompt: data.usageMetadata?.promptTokenCount || 0,
        completion: data.usageMetadata?.candidatesTokenCount || 0,
        total: data.usageMetadata?.totalTokenCount || 0
      }
    };
  }
}
