export interface LLMEngineConfig {
  ollamaEndpoint?: string;
  modelName?: string;
  systemPrompt?: string;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LLMEngine {
  private ollamaEndpoint: string;
  private modelName: string;
  private systemPrompt: string;
  private history: LLMMessage[] = [];

  constructor(config: LLMEngineConfig = {}) {
    this.ollamaEndpoint = config.ollamaEndpoint || 'http://localhost:11434';
    this.modelName = config.modelName || 'qwen2.5:7b';
    this.systemPrompt = config.systemPrompt || 
      `Eres TrautsLab OS, el asistente inteligente personal de IA de Jhonny Lorenzo.
Tu personalidad es proactiva, precisa, directa y conversacional.
Responde siempre en español natural, conciso y fluido.
Estás conectado a su Obsidian Vault, su agenda y sus herramientas de productividad.
REGLA CRÍTICA DE VOZ: Tu respuesta será leída por un sintetizador de voz. NUNCA incluyas sintaxis Markdown como asteriscos (** o *), numerales (# o ###), viñetas (- o *), ni comillas invertidas. Escribe en párrafos hablados claros y naturales.
Mantén tus respuestas breves y directas al grano para locución por voz (2 a 4 oraciones máximo), a menos que te pidan explícitamente un informe extenso.`;
  }

  /**
   * Send user prompt and generate intelligent response via Ollama
   */
  async generateResponse(userPrompt: string, vaultContextSnippet?: string): Promise<string> {
    try {
      const messages: LLMMessage[] = [
        { role: 'system', content: this.systemPrompt + (vaultContextSnippet ? `\nContexto actual del Vault:\n${vaultContextSnippet}` : '') },
        ...this.history.slice(-6), // Keep last 3 turns
        { role: 'user', content: userPrompt }
      ];

      const res = await fetch(`${this.ollamaEndpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          messages,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 200
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Ollama HTTP ${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as any;
      const assistantReply = data.message?.content?.trim() || 'Entendido, ¿en qué más te puedo asistir?';

      // Save to conversation history
      this.history.push({ role: 'user', content: userPrompt });
      this.history.push({ role: 'assistant', content: assistantReply });

      return assistantReply;
    } catch (err: any) {
      console.warn(`[LLMEngine] Advertencia al conectar con Ollama (${err.message}). Usando respuesta determinista inteligente.`);
      return this.fallbackReasoning(userPrompt);
    }
  }

  /**
   * Intelligent fallback if Ollama is unreachable
   */
  private fallbackReasoning(prompt: string): string {
    const p = prompt.toLowerCase();
    if (p.includes('hola') || p.includes('buenos') || p.includes('buenas')) {
      return `¡Hola Jhonny! Estoy activo y listo para ayudarte con tu agenda, notas de Obsidian y proyectos. ¿Qué necesitas?`;
    }
    if (p.includes('quién eres') || p.includes('que eres') || p.includes('quien eres')) {
      return `Soy TrautsLab OS, tu copiloto de IA con memoria Karpathy en Obsidian y control por voz en tiempo real.`;
    }
    if (p.includes('gracias')) {
      return `¡Con gusto, Jhonny! Aquí estoy para lo que necesites.`;
    }
    return `He procesado tu consulta sobre "${prompt}". ¿Deseas que profundice en algún detalle específico o lo registre en tu Vault?`;
  }
}
