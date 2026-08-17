# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased]

---

## [0.1.0-alpha.7] - 2026-08-17 12:28:00 (PET / UTC-5)

### Added
- **Fase 6: Acceso Remoto Móvil y Asistente en la Calle:**
  - **PWA & Service Worker:**
    - Manifiesto `frontend/manifest.json` e iconos adaptables SVG 192px/512px.
    - Service Worker `frontend/sw.js` con estrategia Cache-First y modo offline.
    - Adaptabilidad responsiva móvil (`@media max-width: 900px`) optimizada para iPhone 14 y Pixel 7 (390px).
  - **Telegram Bot Assistant Bridge (`@trautslab/telegram-bridge`):**
    - `TelegramBotBridge`: Controlador con soporte para comandos (`/start`, `/intel`, `/agenda`, `/run`, `/status`), notas de voz con Faster-Whisper y respuestas de voz Kokoro TTS.
    - CLI interactiva y simulación de mensajes (`npm run simulate`).
    - Suite de pruebas unitarias (`tests/bot.test.ts`).
  - **Túneles Seguros & Despliegue:**
    - Scripts de lanzamiento `start-tailscale-serve.sh` y `start-cloudflare-tunnel.sh` con costo $0/mes.
    - Guía de configuración completa en `docs/deployment/mobile-tunnel-setup.md`.
  - **Pruebas Automatizadas en Google Chrome Móvil:**
    - Suite `run-mobile-tests.js` emulando viewport móvil táctil en Chrome con 6/6 pruebas aprobadas y capturas reales.

## [0.1.0-alpha.5] - 2026-08-17 11:05:00 (PET / UTC-5)

### Added
- **Fase 5: Plugin de Obsidian (Centro de Mando Visual Integrado):**
  - Implementación del paquete `@trautslab/obsidian-plugin` con:
    - `TrautsLabPlugin`: Registro de Ribbon Icon (`layout-dashboard`), comandos en la paleta de Obsidian y monitor de estado del motor en la barra de estado.
    - `TrautsLabView`: Vista personalizada (`ItemView`) con estética Glassmorphism, paneles (*Overview, Daily Intel, Skills, Memory/Vault*) y modal de voz interactivo.
    - `TrautsLabSettingTab`: Pestaña de configuración dentro de Obsidian para ajustar la URL del servidor de voz, voz de Kokoro TTS y temporizadores de actualización.
    - `styles.css`: Estilos adaptados a las variables nativas de tema de Obsidian (modo oscuro y alto contraste).
    - Script de despliegue automático hacia `vault/.obsidian/plugins/trautslab-command-center/`.

### Added
- **Fase 4: Pipeline de Voz Local e Híbrido (3-Tier Engine):**
  - Implementación del paquete `@trautslab/voice-engine` con:
    - `FasterWhisperSTTEngine`: Transcripción de audio local ultrarrápida con soporte para aceleración por hardware (MPS/CUDA).
    - `KokoroTTSEngine`: Síntesis de voz natural y ligera (82M parámetros) con latencias inferiores a 250ms.
    - `VoiceIntentRouter`: Enrutador inteligente de intenciones clasificando en Tier 1 (Skills), Tier 2 (Caché instantánea < 25ms) y Tier 3 (Agente headless desatendido).
    - `VoicePipeline`: Orquestador end-to-end de audio, enrutamiento, ejecución y respuesta hablada.
    - `VoiceServer`: Servidor HTTP local (puerto 3030) con endpoints `/api/voice/query` y `/api/voice/health`.
    - CLI interactiva (`npm run simulate`, `npm run query "<texto>"`, `npm run server`).
  - Verificación exitosa de latencias: **2ms - 21ms** en consultas Tier 2 de agenda e inteligencia matutina.

### Added
- **Fase 3: Motor de Habilidades (Skills) y Automatizaciones:**
  - Implementación del paquete `@trautslab/skills-engine` con:
    - `SkillRegistry`: Registro dinámico y ejecución controlada de procedimientos deterministas con métricas de tiempo de ejecución.
    - `MorningIntelScanSkill`: Escaneo de tendencias en GitHub Trending y Hacker News con ingesta en `RAW/` y síntesis en `WIKI/` y caché Tier 2 (`today-intel.json`).
    - `CalendarDailyBriefSkill`: Generación de cronograma diario, compromisos prioritarios y resumen fonético en `today-agenda.json`.
    - `VaultSyncIndexerSkill`: Re-indexación automática de tablas de contenidos jerárquicas en el Vault.
    - `SkillScheduler`: Planificador de tareas desatendidas con `node-cron`.
    - `LaunchdGenerator`: Generador de archivo `com.trautslab.os.scheduler.plist` para ejecución permanente 24/7 en macOS.
    - CLI unificada (`npm run run:skill <id>`, `npm run list`, `npm run cron`, `npm run generate-plist`).
- **Estandarización de Documentación:**
  - Inclusión obligatoria de marcas temporales con **Fecha y Hora Peruana (America/Lima / UTC-5)** en todos los documentos de ingeniería para trazabilidad cronológica intra-día.

### Added
- **Fase 2: Motor de Memoria y Vault (Patrón Karpathy):**
  - Creación de la estructura física del Vault (`vault/RAW/`, `vault/WIKI/`, `vault/OUTPUT/cache/`).
  - Creación del mapa maestro de navegación para agentes `vault/AGENTS.md`.
  - Implementación del paquete `@trautslab/vault-engine` en TypeScript con:
    - `VaultIndexer`: Escaneo recursivo y generación automática de tablas de contenido (`index.md` maestros y temáticos).
    - `VaultWatcher`: Demonio observador de archivos en tiempo real con debounce de 500ms para reindexación automática.
    - `Tier2CacheManager`: Lector y escritor ultrarrápido (<10ms) de snapshots JSON y resúmenes fonéticos para Kokoro TTS.
    - `VaultHealthChecker`: Auditor de integridad, tags y YAML frontmatters.
    - CLI unificada (`npm run index`, `npm run watch`, `npm run health`, `npm run cache:get`).
- **Actualizaciones de Ingeniería y Especificación:**
  - Inclusión del Caso de Uso `UC-06` (Observación en Tiempo Real e Indexación Incremental del Vault) en `docs/requirements/use-cases.md`.
  - Inclusión de los requisitos funcionales `RF-05` (Vault File Watcher) y `RF-06` (Gestor de Caché Tier 2).
  - Actualización del diagrama de componentes y nuevo diagrama de secuencia para el Vault Watcher en `docs/architecture/diagrams.md`.

### Added
- **Incepción del Proyecto:** Creación del documento fundacional `docs/inception/0-main-idea.md` con la visión de TrautsLab OS y sus 4 pilares fundamentales.
- **Análisis de Acceso Móvil y Costos:** Creación de `docs/inception/1-mobile-remote-access-and-costs.md` detallando la arquitectura PWA, túneles seguros (Tailscale/Cloudflare) y desglose de costes ($3-$8/mes).
- **Prototipo Frontend Accesible:**
  - Estructura semántica en HTML5 (`frontend/index.html`) con roles ARIA, atajos globales de teclado (`1-4`, `Espacio/V`, `T`, `Esc`) y soporte para lectores de pantalla.
  - Hoja de estilos `frontend/style.css` con estética moderna *Glassmorphism*, paleta oscura, animaciones de ondas de audio y modo de Alto Contraste.
  - Lógica interactiva en `frontend/app.js` con simulador de enrutamiento por voz de 3 niveles, reloj en vivo, terminal integrada y visor jerárquico del Vault.
- **Especificaciones de Ingeniería de Software:**
  - Especificación formal de Casos de Uso (UC-01 al UC-05) y Requisitos Funcionales (RF-01 al RF-05) con diagramas Mermaid en `docs/requirements/use-cases.md`.
  - Diagramas de arquitectura, componentes, secuencia y actividades en `docs/architecture/diagrams.md`.
  - Guías de contribución (`CONTRIBUTING.md`), control de cambios (`CHANGELOG.md`) y política de versionado semántico (`VERSIONING.md`).

---

### Tipos de Cambios
- `Added` para características nuevas añadidas.
- `Changed` para cambios en funcionalidades existentes.
- `Deprecated` para funcionalidades que serán removidas en futuras versiones.
- `Removed` para funcionalidades eliminadas.
- `Fixed` para corrección de bugs o errores.
- `Security` para mejoras o parches de vulnerabilidades.
