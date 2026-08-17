# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased]

### Added
- Integración de arquitectura de voz en tiempo real con soporte para hotkey global.
- Pipeline de enrutamiento inteligente de 3 niveles (*Tiers 1, 2 y 3*).
- Plugin base de Obsidian para el Dashboard Command Center con soporte de *Hot Reload*.

---

## [0.1.0-alpha.3] - 2026-08-17 10:53:30 (PET / UTC-5)

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
