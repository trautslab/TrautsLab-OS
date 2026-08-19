# Diagrama de Secuencia: Notificaciones Push y Temporizadores Diferidos (`telegram-notify`)

> **ID:** `SEQ-06` | **Categoría:** Diagramas de Secuencia  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)  
> **Estándar Horario:** `PET / UTC-5 - Hora Perú`

---

## 🔄 Flujo de Ejecución

```mermaid
sequenceDiagram
    autonumber
    actor Jhonny as Jhonny Lorenzo
    participant VoiceEngine as Voice Engine / Web HUD
    participant LLMRouter as Enrutador Semántico LLM
    participant Skill as Skill telegram-notify
    participant Timer as Background Timer (setTimeout)
    participant TG as Telegram Bot (@TrautsLabBot)

    Jhonny->>VoiceEngine: "¿Puedes mandarme una notificación en 2 minutos para votar la basura?"
    VoiceEngine->>LLMRouter: Clasificación de intención
    Note over LLMRouter: Detecta: telegram-notify con delayMinutes=2
    LLMRouter->>Skill: execute({ delayMinutes: 2, message: "Votar la basura" })
    Skill->>Timer: Inicia temporizador de 120,000ms en segundo plano
    Skill-->>VoiceEngine: "✓ Recordatorio programado: te enviaré una notificación en 2 minutos."
    VoiceEngine-->>Jhonny: Respuesta hablada inmediata
    
    Note over Timer: Transcurren 2 minutos...
    Timer->>TG: sendTelegramNotification("⏰ Recordatorio", "Votar la basura")
    TG-->>Jhonny: 🔔 Notificación Push en pantalla de bloqueo del teléfono
```

---
[⬅️ Volver al Índice de Diagramas](../index.md)
