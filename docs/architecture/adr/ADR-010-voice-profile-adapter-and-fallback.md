# ADR-010: Voice Profile Adapter, Pre-computed Speaker Tensors y Fallback Transparente a Kokoro 82M

## Estado
Aceptado

## Contexto
El usuario requiere la capacidad de utilizar voces clonadas personalizadas (ej. el timbre de voz de Jhonny Lorenzo) sin comprometer el presupuesto estricto de latencia de TrautsLab OS (< 250ms de tiempo de síntesis de voz en Apple Silicon). Los sistemas de clonación zero-shot convencionales en PyTorch re-procesan el archivo de audio de referencia en cada inferencia, añadiendo entre 500ms y 2000ms de sobrecosto inaceptable para una interfaz conversacional fluida.

## Decisión
1. **Pre-cómputo Offline del Speaker Embedding:** Se extrae el vector de condicionamiento acústico de 512 dimensiones una sola vez y se almacena en `models/voice_profiles/jhonny_profile.json`.
2. **Inyección en Tiempo de Inferencia:** `KokoroTTSEngine` inyecta directamente el vector pre-cargado en la VRAM de Metal GPU durante la pasada feed-forward de síntesis.
3. **Fallback Automático e Indestructible:** Si el perfil clonado no está calibrado, sufre corrupción o el microservicio falla, el sistema conmuta inmediatamente al perfil base `kokoro_default` (`es_f_locutora`) sin interrupción de la experiencia del usuario.

## Consecuencias
- **Positivas:**
  - Latencia idéntica a la voz predeterminada (~180ms a 220ms en Apple Silicon).
  - Robustez y resiliencia ante errores gracias al fallback predeterminado garantizado.
  - Gestión programática mediante Skill `voice-profile-manage` y MCP Tool 13.
- **Negativas:**
  - Requiere calibración inicial para registrar nuevos hablantes.
