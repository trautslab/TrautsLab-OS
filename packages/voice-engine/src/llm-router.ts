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

  constructor(endpoint = 'http://localhost:11434', model = 'qwen2.5:3b') {
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
  async classify(query: string, availableSkills?: any[]): Promise<LLMIntentResult | null> {
    const { dateStr, dayName, timeStr } = this.getPeruTimeContext();

    const skillsDescription = availableSkills && availableSkills.length > 0
      ? availableSkills.map((s, idx) => `${idx + 1}. "${s.metadata.id}": ${s.metadata.description} (Dominio: ${s.metadata.domain})`).join('\n')
      : `1. "calendar-add-event": Agendar, programar, cambiar o asistir a un evento, cita, cena, película o reunión.
2. "calendar-archive-event": Archivar, completar o limpiar compromisos o todo el día.
3. "calendar-daily-brief": Consultar agenda de hoy o cronograma.
4. "morning-intel-scan": Escaneo de noticias, GitHub Trending y Hacker News.
5. "vault-sync-indexer": Reindexar o estructurar el Obsidian Vault.`;

    const systemPrompt = `Eres el Enrutador Semántico y Extractor de Herramientas de TrautsLab OS para Jhonny Lorenzo.
Contexto Temporal Actual:
- Fecha de Hoy: ${dateStr} (${dayName})
- Hora Actual (Perú): ${timeStr}

Analiza la orden del usuario (que proviene de voz o texto en español) y determina semánticamente la herramienta correspondiente o si es conversación general.

Herramientas del Sistema:
${skillsDescription}
6. "conversational_chat": Charla, dudas generales, explicaciones, preguntas no relacionadas a herramientas.

Reglas Semánticas:
- Si el usuario dice "archivar el día", "archivar todo", "artivar", "completar el día" o variaciones, selecciona "calendar-archive-event" con action "archive_all".
- Si el usuario menciona ir a un lugar, ver una película, cine, cena, reunión, cita médica, o cualquier compromiso con hora/fecha, selecciona "calendar-add-event" y extrae title, date, time y location.
- Si pide enviar una notificación, mandar un mensaje a Telegram, avisar por Telegram o enviar un recordatorio push a su celular, selecciona "telegram-notify" y coloca el mensaje en "message" y un título en "title".
- Si pregunta qué tiene hoy o qué hay en su agenda, selecciona "calendar-daily-brief" o TIER_2_CACHE con target "today-agenda".
- Si pregunta por noticias o tendencias de IA, selecciona TIER_2_CACHE con target "today-intel" o "morning-intel-scan".

Debes responder ÚNICAMENTE un objeto JSON válido con esta estructura exacta:
{
  "intent": "id-de-la-skill" | "today-agenda" | "today-intel" | "conversational_chat",
  "tier": "TIER_1_SKILL" | "TIER_2_CACHE" | "TIER_3_HEADLESS",
  "confidence": 0.95,
  "parameters": {
    "title": "Título limpio y descriptivo del evento o notificación",
    "message": "Texto o mensaje a enviar si es notificación",
    "date": "YYYY-MM-DD (calculado relativo a hoy ${dateStr})",
    "time": "HH:MM AM/PM (ej: 09:30 PM)",
    "priority": "HIGH" | "NORMAL" | "LOW",
    "location": "Lugar si aplica",
    "action": "add" | "modify" | "archive_one" | "archive_all"
  },
  "reasoning": "Breve explicación semántica de por qué elegiste esta acción",
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
          keep_alive: '60m',
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

      // Canonicalize intent and tier
      let canonicalIntent = parsed.intent || 'conversational_chat';
      let tier: LLMIntentResult['tier'] = parsed.tier || 'TIER_3_HEADLESS';

      if (parsed.parameters?.action === 'archive_all' || parsed.parameters?.action === 'archive_one' || String(parsed.intent).includes('archive')) {
        canonicalIntent = 'calendar-archive-event';
        tier = 'TIER_1_SKILL';
      } else if (String(parsed.intent).includes('telegram') || String(parsed.intent).includes('notify') || String(parsed.intent).includes('notifica') || parsed.parameters?.message) {
        canonicalIntent = 'telegram-notify';
        tier = 'TIER_1_SKILL';
      } else if (parsed.parameters?.action === 'add' || parsed.parameters?.action === 'modify' || String(parsed.intent).includes('add-event') || String(parsed.intent).includes('schedule')) {
        canonicalIntent = 'calendar-add-event';
        tier = 'TIER_1_SKILL';
      } else if (String(parsed.intent).includes('intel') || String(parsed.intent).includes('morning')) {
        canonicalIntent = 'morning-intel-scan';
        tier = 'TIER_1_SKILL';
      } else if (String(parsed.intent).includes('indexer') || String(parsed.intent).includes('vault')) {
        canonicalIntent = 'vault-sync-indexer';
        tier = 'TIER_1_SKILL';
      } else if (String(parsed.intent).includes('brief') || canonicalIntent === 'today-agenda') {
        canonicalIntent = 'today-agenda';
        tier = 'TIER_2_CACHE';
      } else if (canonicalIntent === 'today-intel') {
        tier = 'TIER_2_CACHE';
      }

      // Ensure date format fallback
      if (parsed.parameters && !parsed.parameters.date) {
        parsed.parameters.date = dateStr;
      }

      return {
        intent: canonicalIntent,
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
