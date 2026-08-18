/**
 * TrautsLab OS — LLM Semantic Router & Function Calling Engine
 * Uses local Qwen / Ollama (or Cloud LLM) to semantically classify intents
 * and extract structured arguments for deterministic Skill execution.
 */

export interface LLMIntentResult {
  intent: 'calendar-add-event' | 'calendar-archive-event' | 'calendar-daily-brief' | 'morning-intel-scan' | 'vault-sync-indexer' | 'conversational_chat';
  tier: 'TIER_1_SKILL' | 'TIER_2_CACHE' | 'TIER_3_HEADLESS';
  confidence: number;
  parameters: {
    title?: string;
    date?: string; // YYYY-MM-DD
    time?: string; // e.g. 09:30 PM
    priority?: 'LOW' | 'NORMAL' | 'HIGH';
    location?: string;
    action?: 'add' | 'modify' | 'archive_one' | 'archive_all';
    targetEventTitle?: string;
  };
  reasoning: string;
  suggestedReply?: string;
}

export class LLMIntentRouter {
  private ollamaEndpoint: string;
  private modelName: string;

  constructor(endpoint = 'http://localhost:11434', model = 'qwen2.5:7b') {
    this.ollamaEndpoint = process.env.OLLAMA_ENDPOINT || endpoint;
    this.modelName = process.env.OLLAMA_MODEL || model;
  }

  private getPeruTimeContext(): { dateStr: string; dayName: string; timeStr: string } {
    const now = new Date();
    const peruDateStr = now.toLocaleDateString('en-CA', { timeZone: 'America/Lima' }); // YYYY-MM-DD
    const dayName = now.toLocaleDateString('es-PE', { timeZone: 'America/Lima', weekday: 'long' });
    const timeStr = now.toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: true });
    return { dateStr: peruDateStr, dayName, timeStr };
  }

  /**
   * Semantically classifies user query using LLM with structured JSON output
   */
  async classify(query: string): Promise<LLMIntentResult | null> {
    const { dateStr, dayName, timeStr } = this.getPeruTimeContext();

    const systemPrompt = `Eres el Enrutador Semántico y Extractor de Herramientas de TrautsLab OS para Jhonny Lorenzo.
Contexto Temporal Actual:
- Fecha de Hoy: ${dateStr} (${dayName})
- Hora Actual (Perú): ${timeStr}

Analiza la orden del usuario (que puede provenir de voz o texto con posibles errores fonéticos) y determina si requiere ejecutar una herramienta o si es una conversación general.

Herramientas Disponibles:
1. "calendar-add-event": Si el usuario expresa la intención de agendar, programar, cambiar, asistir o realizar un compromiso, cita, reunión, evento, ver una película, cine, cena, almuerzo, doctor, etc. (Ej: "quiero ir al cine a las 9:30 pm", "agenda cena mañana", "tengo dentista a las 4").
2. "calendar-archive-event": Si el usuario pide archivar, completar, dar por concluida o limpiar una tarea o todo el día.
3. "calendar-daily-brief": Si el usuario pregunta qué tiene hoy, su agenda, qué compromisos hay.
4. "morning-intel-scan": Si pide escanear noticias, tendencias de GitHub, Hacker News o briefing matutino.
5. "vault-sync-indexer": Si pide sincronizar, reindexar o auditar el Vault de Obsidian.
6. "conversational_chat": Charla, dudas generales, explicaciones, preguntas no relacionadas a herramientas.

Debes responder ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "intent": "calendar-add-event" | "calendar-archive-event" | "calendar-daily-brief" | "morning-intel-scan" | "vault-sync-indexer" | "conversational_chat",
  "tier": "TIER_1_SKILL" | "TIER_2_CACHE" | "TIER_3_HEADLESS",
  "confidence": 0.95,
  "parameters": {
    "title": "Título limpio y descriptivo del evento",
    "date": "YYYY-MM-DD (calculado relativo a hoy ${dateStr})",
    "time": "HH:MM AM/PM (ej: 09:30 PM)",
    "priority": "HIGH" | "NORMAL" | "LOW",
    "location": "Lugar si aplica",
    "action": "add" | "modify" | "archive_one" | "archive_all"
  },
  "reasoning": "Breve explicación de por qué elegiste esta herramienta",
  "suggestedReply": "Respuesta hablada natural y concisa para el usuario"
}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout for reliable Ollama reasoning

      const res = await fetch(`${this.ollamaEndpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.modelName,
          stream: false,
          format: 'json',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          options: {
            temperature: 0.1, // High precision
            num_predict: 220
          }
        })
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Ollama HTTP ${res.status}: ${res.statusText}`);
      }

      const data = (await res.json()) as any;
      const content = data.message?.content?.trim();
      if (!content) return null;

      const parsed = JSON.parse(content);

      // Normalize tier
      let tier: LLMIntentResult['tier'] = 'TIER_3_HEADLESS';
      if (['calendar-add-event', 'calendar-archive-event', 'morning-intel-scan', 'vault-sync-indexer'].includes(parsed.intent)) {
        tier = 'TIER_1_SKILL';
      } else if (parsed.intent === 'calendar-daily-brief') {
        tier = 'TIER_2_CACHE';
      }

      // Ensure date format fallback
      if (parsed.parameters && !parsed.parameters.date) {
        parsed.parameters.date = dateStr;
      }

      return {
        intent: parsed.intent || 'conversational_chat',
        tier,
        confidence: parsed.confidence || 0.9,
        parameters: parsed.parameters || {},
        reasoning: parsed.reasoning || 'Clasificación semántica mediante LLM Qwen',
        suggestedReply: parsed.suggestedReply
      };
    } catch (err: any) {
      console.warn(`[LLMIntentRouter] LLM inference warning (${err.message}). Falling back to fast regex.`);
      return null;
    }
  }
}
