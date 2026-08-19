# ADR-008: Abstracción de Proveedores Multi-LLM (Ollama, Gemini, OpenAI, Claude)

## Estado
Aceptado

## Contexto
TrautsLab OS nació como una solución centrada en inferencia local con Ollama (`qwen2.5:3b`). Sin embargo, para su comercialización como producto SaaS / Desktop distribuible a empresas o usuarios que requieren modelos de lenguaje de frontera (Google Gemini 2.0 Flash / 1.5 Pro, OpenAI GPT-4o, Anthropic Claude 3.5 Sonnet) con esquemas Bring Your Own Key (BYOK), se requiere una capa de abstracción programática desacoplada de la infraestructura subyacente.

## Decisión
Implementar el patrón Factory y la interfaz `LLMProvider` en `@trautslab/skills-engine`:
1. **Interfaz Común:** Define los métodos `generate()`, `chat()` e `isAvailable()`.
2. **Proveedores Soportados:**
   - `OllamaProvider`: Inferencia local privada sin costo de API.
   - `GeminiProvider`: Google AI Studio / Vertex AI con generación de JSON nativo y system instructions.
   - `OpenAIProvider`: Chat Completions API estándar (`gpt-4o-mini`, `gpt-4o`, `o3-mini`).
   - `ClaudeProvider`: Messages API de Anthropic (`claude-3-5-sonnet`).
3. **Resolución Dinámica:** Lectura de variables de entorno `LLM_PROVIDER`, `GOOGLE_AI_API_KEY`, `OPENAI_API_KEY` y `ANTHROPIC_API_KEY`.
4. **Fallback Automático:** En caso de indisponibilidad del proveedor configurado, el factory recurre en cascada al siguiente proveedor disponible.

## Consecuencias
- **Positivas:**
  - TrautsLab OS es comercializable como solución SaaS o Desktop con soporte multi-cloud.
  - Flexibilidad para cambiar de modelo o proveedor sin tocar la lógica de negocio de las habilidades ni del pipeline de voz.
- **Negativas:**
  - Requiere mantenimiento de compatibilidad con las especificaciones de API de cada proveedor.
