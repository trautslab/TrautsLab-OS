# Changelog — TrautsLab OS

Todas las modificaciones notables de este proyecto están documentadas en este archivo siguiendo el estándar [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [Semantic Versioning (SemVer)](https://semver.org/).

---

## [1.3.0] — 2026-08-19 — *The Commercial Multi-LLM, NotebookLM & Channels Hub Release*

### 🚀 Añadido
- **Google NotebookLM Grounded Research & MCP Tool 12:**
  - Habilidad `NotebookLMSyncSkill` en `@trautslab/skills-engine` para sintetizar libretas y notas de investigación en `RAW/notebooklm/[date]-[slug].md` con Frontmatter YAML estructurado.
  - Registrada la **Herramienta 12: `trautslab_notebooklm_query`** en el catálogo de `@trautslab/mcp-server`.
- **Abstracción Multi-LLM para Escalamiento Comercial (`@trautslab/skills-engine`):**
  - Módulo de proveedores `LLMProvider` con soporte nativo para **Google Gemini 2.0 Flash / 1.5 Pro**, **OpenAI GPT-4o / o3-mini**, **Anthropic Claude 3.5 Sonnet** y **Ollama Local**.
  - `LLMProviderFactory` para resolución dinámica de proveedores y fallback automático en cascada.
  - Especificado en `ADR-008: Abstracción de Proveedores Multi-LLM`.
- **Hub de Canales e Integraciones & Enrutamiento Bidireccional Simétrico:**
  - Módulo `ChannelDispatcher` en `@trautslab/voice-engine` que garantiza que toda interacción entrante se responda simétricamente por el mismo medio de origen (Telegram, Voice Link, MCP, Desktop App, Slack, macOS Notifications).
  - Pestaña interactiva **Modo 8: CHANNELS** en el HUD con monitor de tráfico en vivo mediante Server-Sent Events (`CHANNEL_TRAFFIC`).
  - Especificado en `ADR-009: Enrutamiento Simétrico y Monitoreo de Canales Bidireccionales`.
- **Eliminación Total de Datos Hardcodeados & Sistema de Diseño UI:**
  - AI Wire Ticker dinámico conectado a `/api/intel/latest`.
  - Lector Markdown del Vault conectado a `/api/vault/file?path=...`.
  - Creador dinámico de directivas en el Cockpit con persistencia y sincronización.
  - Especificación oficial de paleta de colores y variables CSS en `docs/design-system/tokens.md`.

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

---

## [0.2.0-beta] — 2026-08-16 — *The Voice & Vault Prototype Stage*

### 🧪 Pruebas y Experimentos Iniciales
- Integración experimental del servidor Faster-Whisper con aceleración MPS en Apple Silicon.
- Primer prototipo del motor de síntesis Kokoro TTS (82M) con modulación de onda acústica.
- Implementación de la memoria basada en sistema de archivos y primeras pruebas de indexación Markdown.
- Prototipo del componente de Esfera Neuronal 3D en WebGL/Three.js.

---

## [0.1.0-alpha] — 2026-08-15 — *Proof of Concept & Architecture Inception*

### 💡 Concepción & Arquitectura
- Definición de la tesis arquitectónica: *Local-First Voice Operating System con memoria en Obsidian Vault*.
- Especificación inicial de las 3 capas de memoria: `RAW/`, `WIKI/` y `OUTPUT/`.
- Configuración del monorepo con TypeScript y Node.js.
- Pruebas iniciales de inferencia local con Ollama y modelos de la familia Qwen.

