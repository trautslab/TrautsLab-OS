# Diagrama de Secuencia: Mensajería y Notas de Voz en Telegram (@TrautsLabBot)

> **ID:** `SEQ-05` | **Categoría:** Diagramas de Secuencia  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)  
> **Estándar Horario:** `PET / UTC-5 - Hora Perú`

---

## 🔄 Flujo de Ejecución

```mermaid
sequenceDiagram
    autonumber
    actor Jhonny as Jhonny Lorenzo (@John)
    participant TG as Telegram Bot API (@TrautsLabBot)
    participant Poller as Telegram Poller Daemon
    participant Transcriber as Whisper Large v3 Turbo (GPU Metal)
    participant Pipeline as Voice Pipeline (LLM Router)
    participant Vault as Obsidian Vault
    participant Notifier as Telegram Notifier

    Jhonny->>TG: Envía Nota de Voz (.oga / Opus)
    TG-->>Poller: Mensaje detectado en Long-Polling
    Poller->>TG: Descarga archivo .oga
    Poller->>Transcriber: Ejecuta FFmpeg (Opus->WAV) y Whisper Metal
    Note over Transcriber: Transcripción acústica precisa en < 900ms
    Transcriber-->>Poller: Texto transcrito (ej. "Agendar cena hoy a las 8pm")
    Poller->>Pipeline: Procesa texto mediante LLM Semantic Router
    Pipeline->>Vault: Ejecuta Skill calendar-add-event (Escribe Markdown)
    Pipeline-->>Poller: Confirmación textual y audio TTS
    Poller->>Notifier: Envía mensaje de confirmación formateado
    Notifier->>TG: sendMessage / sendVoice
    TG-->>Jhonny: "✓ He agendado 'Cena hoy' para el 2026-08-19 a las 08:00 PM."
```

---
[⬅️ Volver al Índice de Diagramas](../index.md)
