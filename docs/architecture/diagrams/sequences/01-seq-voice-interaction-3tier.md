# Diagrama de Secuencia: Interacción por Voz y Enrutamiento 3-Tier

> **ID:** `SEQ-01` | **Categoría:** Diagramas de Secuencia  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)  
> **Estándar Horario:** `PET / UTC-5 - Hora Perú`

---

## 🔄 Flujo de Ejecución

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Jhonny Lorenzo
    participant UI as Web HUD / Hotkey
    participant STT as FasterWhisper STT (Metal)
    participant Router as LLM Intent Router (qwen2.5:3b)
    participant Tier2 as Fast Cache (today-agenda.json)
    participant TTS as Kokoro TTS Engine
    
    Usuario->>UI: Habla ("¿Qué tengo en agenda hoy?")
    UI->>STT: Envía buffer de audio PCM
    STT->>Router: Retorna texto ("¿Qué tengo en agenda hoy?")
    
    Note over Router: Clasifica intención -> Tier 2 (Lectura de Caché)
    
    Router->>Tier2: Lee snapshot JSON en < 1ms
    Tier2-->>Router: "Tienes 2 compromisos programados..."
    Router->>TTS: Envía texto sintetizable
    TTS-->>UI: Retorna stream de audio sintetizado
    UI-->>Usuario: Reproduce respuesta fonética en < 800ms
```

---
[⬅️ Volver al Índice de Diagramas](../index.md)
