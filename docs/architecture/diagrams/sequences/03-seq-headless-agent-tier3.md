# Diagrama de Secuencia: Tarea Compleja con Agente Headless (Tier 3)

> **ID:** `SEQ-03` | **Categoría:** Diagramas de Secuencia  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)  
> **Estándar Horario:** `PET / UTC-5 - Hora Perú`

---

## 🔄 Flujo de Ejecución

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Jhonny Lorenzo
    participant Router as LLM Intent Router
    participant Agent as Agente Headless CLI (Ollama/CLI)
    participant Vault as Vault Storage
    participant TTS as Kokoro TTS Engine

    Usuario->>Router: "Investiga a fondo arquitecturas de voz local y genera reporte"
    Note over Router: Clasifica intención -> Tier 3 (Headless Agent)
    Router->>Agent: Lanza subproceso asíncrono con objetivo
    Router->>TTS: "He lanzado la investigación en segundo plano. Te avisaré al finalizar."
    TTS-->>Usuario: Notificación por voz inmediata
    
    Note over Agent: Agente investiga, sintetiza y escribe archivos
    Agent->>Vault: Escribe OUTPUT/research-local-voice-arch.md
    Agent->>TTS: Emite evento de finalización
    TTS-->>Usuario: "El reporte de investigación ya está listo en tu carpeta OUTPUT."
```

---
[⬅️ Volver al Índice de Diagramas](../index.md)
