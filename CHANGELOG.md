# Changelog — TrautsLab OS

Todas las modificaciones notables de este proyecto están documentadas en este archivo siguiendo el estándar [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [Semantic Versioning (SemVer)](https://semver.org/).

---

## [1.2.0] — 2026-08-19 — *The Autonomous Multi-Agent & Scaling Release*

### 🚀 Añadido
- **Motor HyperAgent Tier 3 (`@trautslab/skills-engine`):**
  - Implementada la cuadrilla de 4 roles especializados: `HyperPlanner` (descomposición estratégica), `HyperNavigator` (exploración híbrida del Vault), `HyperEditor` (redacción de Markdown y código TypeScript) y `HyperExecutor` (verificación, testeo e indexación).
  - Bucle de auto-reparación (*Self-Repair Loop*) con hasta 3 reintentos automáticos ante fallos de sintaxis o de entorno.
  - Carga en caliente (*Hot-Reload*) de nuevas habilidades en tiempo de ejecución.
- **Servidor Model Context Protocol (MCP) (`@trautslab/mcp-server`):**
  - Servidor estándar JSON-RPC 2.0 (`stdio` / `SSE`) con catálogo de **11 herramientas tipadas**:
    1. `trautslab_vault_read`
    2. `trautslab_vault_search`
    3. `trautslab_vault_semantic_search`
    4. `trautslab_vault_reindex`
    5. `trautslab_calendar_get_agenda`
    6. `trautslab_calendar_add_event`
    7. `trautslab_calendar_edit_event`
    8. `trautslab_calendar_archive`
    9. `trautslab_morning_intel_scan`
    10. `trautslab_telegram_notify`
    11. `trautslab_hyperagent_run_task`
  - Guía completa de onboarding y configuración para Antigravity IDE, Claude Code, Cursor y Cline (`docs/mcp/onboarding-guide.md`).
- **Motor de Búsqueda Vectorial Híbrida (`@trautslab/vault-engine`):**
  - Módulo `HybridSearchEngine` combinando BM25 léxico con similitud coseno de embeddings generados localmente mediante Ollama (`qwen2.5:3b`).
  - Habilidad `VaultSemanticSearchSkill` integrada en el pipeline de voz y en el servidor MCP.
- **Aplicación Nativa de Escritorio con Tauri v2 (`packages/desktop-app`):**
  - Shell de escritorio nativa en Rust + WebKit con huella de memoria inferior a 15 MB RAM.
  - Icono persistente en la barra de menú de macOS (System Tray) y atajo global a nivel de sistema operativo (`Cmd+Shift+Space`).
  - Lanzador unificado `npm run desktop` sin bugs en terminal.
- **Modularización de Documentación de Arquitectura:**
  - Desglose de `use-cases` en carpetas individuales (`docs/requirements/use-cases/UC-01` a `UC-14` + `index.md`).
  - Desglose de diagramas de arquitectura en vistas globales, secuencias (`01` a `09`) y actividades (`docs/architecture/diagrams/`).
  - Creados ADR-006 (Escalabilidad MCP y Tauri) y ADR-007 (Cuadrilla Multi-Rol HyperAgent Tier 3).

---

## [1.1.0] — 2026-08-18 — *The Real-Time & Telegram Intelligence Release*

### 🚀 Añadido
- **Bridge Bidireccional de Telegram (`@trautslab/telegram-bridge`):**
  - Demonio con Long-Polling para el bot `@TrautsLabBot`.
  - Transcripción acelerada por Metal GPU de notas de voz (.oga / Opus) usando Whisper Large v3 Turbo en menos de 900ms.
- **Habilidad de Notificaciones Push & Temporizadores Diferidos (`telegram-notify`):**
  - Despacho inmediato de alertas con formato Markdown.
  - Programación de recordatorios diferidos mediante temporizadores en background (`delayMinutes` / `setTimeout`).
- **Canal Reactivo Server-Sent Events (SSE):**
  - Endpoint `/api/events/live` en el servidor de voz (:3030).
  - Actualización instantánea (<100ms) del timeline del HUD ante eventos `SCHEDULE_UPDATED`, `TASK_ARCHIVED` o `INTEL_UPDATED` sin recargas de página.
- **Edición y Archivado In-Place de la Agenda:**
  - Botón de edición `✏️` y modal interactivo para modificar hora o título de compromisos en `daily-agenda-[fecha].md`.
  - Endpoint `POST /api/vault/agenda/edit`.
  - Botón `📦` para archivar tareas completadas o la jornada entera.
- **Hub de Observabilidad E2E y Telemetría:**
  - Panel modal accesible con la tecla `O` que expone signos vitales de hardware (GPU Metal, RAM, modelos activos) y trazas acústicas de 5 etapas con latencias milimétricas.
  - Exportación automática del diario de sesión a `OUTPUT/reports/session-journal-[fecha].md`.
- **Arquitectura y Especificaciones Formales:**
  - Creados ADR-001 a ADR-005.
  - Suite de pruebas automatizadas en Google Chrome nativo (11 pruebas de escritorio + 6 pruebas móviles PWA).

---

## [1.0.0] — 2026-08-17 — *The Foundation & Karpathy Vault Release*

### 🚀 Añadido
- **Arquitectura Monorepo Inicial:**
  - Creación de `@trautslab/vault-engine`, `@trautslab/skills-engine`, `@trautslab/voice-engine` y `frontend`.
- **Estructura de Memoria Obsidian Vault (Patrón Karpathy):**
  - Jerarquía de 3 capas: `RAW/` (ingesta cruda), `WIKI/` (conocimiento estructurado con índices `index.md`) y `OUTPUT/` (entregables y cronogramas).
  - Observador en tiempo real con Chokidar (`vault-watcher`) y debounce de 500ms.
- **Pipeline de Voz de 3 Niveles:**
  - Tier 1: Habilidades deterministas (`morning-intel-scan`, `calendar-daily-brief`, `calendar-add-event`, `vault-sync-indexer`).
  - Tier 2: Consultor de caché ultrarrápido (<20ms) desde snapshots JSON en el Vault.
  - Tier 3: Agente conversacional LLM mediante Ollama local (`qwen2.5:3b`).
  - Transcripción STT local (Faster-Whisper) y síntesis TTS con Kokoro.
- **Web HUD Cockpit:**
  - Interfaz gráfica inspirada en interfaces aeroespaciales (*Amber Void* / *Dark Glass*).
  - Esfera Neuronal 3D en Three.js reactiva al audio.
  - 4 Modos iniciales: Cockpit, Daily Intel, Vault Explorer y Skills Directory.
  - Atajos de teclado completos (`1-4`, `L`, `H`, `T`, `V`, `Espacio`).
