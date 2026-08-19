/**
 * TrautsLab OS — LLM Provider Factory
 * Resolves the active provider dynamically based on environment variables or explicit options.
 */

import { ClaudeProvider } from './claude-provider.js';
import { GeminiProvider } from './gemini-provider.js';
import { OllamaProvider } from './ollama-provider.js';
import { OpenAIProvider } from './openai-provider.js';
import { LLMProvider, SupportedLLMProvider } from './types.js';

export class LLMProviderFactory {
  private static instances: Map<SupportedLLMProvider, LLMProvider> = new Map();

  static getProvider(providerName?: SupportedLLMProvider): LLMProvider {
    const activeName = (
      providerName ||
      process.env.LLM_PROVIDER ||
      'ollama'
    ).toLowerCase() as SupportedLLMProvider;

    if (this.instances.has(activeName)) {
      return this.instances.get(activeName)!;
    }

    let provider: LLMProvider;
    switch (activeName) {
      case 'gemini':
        provider = new GeminiProvider();
        break;
      case 'openai':
        provider = new OpenAIProvider();
        break;
      case 'anthropic':
        provider = new ClaudeProvider();
        break;
      case 'ollama':
      default:
        provider = new OllamaProvider();
        break;
    }

    this.instances.set(activeName, provider);
    return provider;
  }

  static async getAvailableProvider(): Promise<LLMProvider> {
    const preferred = (process.env.LLM_PROVIDER || 'ollama').toLowerCase() as SupportedLLMProvider;
    const provider = this.getProvider(preferred);
    if (await provider.isAvailable()) {
      return provider;
    }

    // Fallback order: Ollama -> Gemini -> OpenAI -> Anthropic
    const fallbackList: SupportedLLMProvider[] = ['ollama', 'gemini', 'openai', 'anthropic'];
    for (const name of fallbackList) {
      if (name !== preferred) {
        const fallbackProvider = this.getProvider(name);
        if (await fallbackProvider.isAvailable()) {
          console.warn(`[LLMProviderFactory] Usando proveedor fallback: ${name}`);
          return fallbackProvider;
        }
      }
    }

    // Return preferred even if not reachable
    return provider;
  }
}
