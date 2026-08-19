# Tabla de Contenidos Maestra: Diagramas de Arquitectura, Secuencia y Actividades

> **Directorio:** `docs/architecture/diagrams/`  
> **Proyecto:** TrautsLab OS  
> **Versión:** 1.2.0  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)  
> **Estándar Horario:** `PET / UTC-5 - Hora Perú`

---

## 🧭 Índice Visual de Arquitectura

Este directorio contiene las representaciones arquitectónicas formales del sistema en **Mermaid**, modularizadas por categoría para evitar la sobrecarga de lectura:

### 🏛️ 1. Vistas Globales y Topología
- [01. Diagrama de Topología de Capas Global](./01-global-architecture-topology.md) — Topología desde cliente hasta almacenamiento persistente.
- [02. Diagrama de Componentes del Monorepo](./02-monorepo-component-architecture.md) — Relación entre paquetes y librerías del sistema.

### 🔄 2. Diagramas de Secuencia (`sequences/`)
- [01. Flujo de Interacción por Voz & Enrutamiento 3-Tier](./sequences/01-seq-voice-interaction-3tier.md)
- [02. Automatización Matutina (*Daily Intel Cron*)](./sequences/02-seq-morning-intel-automation.md)
- [03. Tarea Compleja con Agente Headless (Tier 3)](./sequences/03-seq-headless-agent-tier3.md)
- [04. Observación en Tiempo Real e Indexación Incremental](./sequences/04-seq-vault-watcher-and-indexing.md)
- [05. Flujo de Notas de Voz en Telegram con Whisper Metal](./sequences/05-seq-telegram-voice-and-whisper-metal.md)
- [06. Flujo de Notificaciones Push & Temporizadores Diferidos](./sequences/06-seq-telegram-push-and-delayed-timers.md)
- [07. Flujo Reactivo Server-Sent Events (SSE) y Web HUD](./sequences/07-seq-realtime-sse-live-sync.md)
- [08. Flujo de Ejecución de Herramientas MCP para Agentes LLM](./sequences/08-seq-mcp-tool-execution.md)

### ⚙️ 3. Diagramas de Actividades y Estados (`activities/`)
- [01. Flujo de Decisión del Enrutador Semántico LLM](./activities/01-act-intent-decision-router.md)
- [02. Ciclo de Vida de Ingesta y Navegación del Vault (RAW ➔ WIKI ➔ OUTPUT)](./activities/02-act-karpathy-vault-lifecycle.md)
