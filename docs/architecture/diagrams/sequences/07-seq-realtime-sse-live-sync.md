# Diagrama de Secuencia: Flujo Reactivo Server-Sent Events (SSE) y Web HUD

> **ID:** `SEQ-07` | **Categoría:** Diagramas de Secuencia  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)  
> **Estándar Horario:** `PET / UTC-5 - Hora Perú`

---

## 🔄 Flujo de Ejecución

```mermaid
sequenceDiagram
    autonumber
    actor User as Jhonny (Telegram / Voz)
    participant Server as Voice Server (Port 3030)
    participant Vault as Obsidian Vault
    participant SSE as Stream SSE (/api/events/live)
    participant HUD as Frontend Web HUD (Port 3000)

    HUD->>SSE: Conexión persistente abierta al cargar (EventSource)
    User->>Server: Acción (Agendar, Archivar o Editar)
    Server->>Vault: Modifica archivo Markdown
    Server->>SSE: broadcastLiveEvent('SCHEDULE_UPDATED')
    SSE-->>HUD: data: {"type": "SCHEDULE_UPDATED", "timestamp": ...}
    Note over HUD: Re-renderiza cronograma en < 100ms sin parpadeos
    HUD-->>User: Feedback visual inmediato con sonido/toast
```

---
[⬅️ Volver al Índice de Diagramas](../index.md)
