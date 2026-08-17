# TrautsLab OS — Roadmap de Implementación Secuencial

> **Documento:** `docs/roadmap/implementation-roadmap.md`  
> **Proyecto:** TrautsLab OS  
> **Estado:** Aprobado para Ejecución  
> **Fecha y Hora:** 2026-08-17 10:46:29 (PET / UTC-5 - Hora Perú)  

Este documento establece la **secuencia cronológica de ingeniería y desarrollo** para construir TrautsLab OS de forma modular, incremental y verificable, avanzando desde los cimientos de memoria y automatización hasta la capa de voz en tiempo real y el plugin para Obsidian.

---

## 🗺️ Diagrama de Fases del Roadmap

```mermaid
gantt
    title TrautsLab OS — Secuencia de Implementación
    dateFormat  YYYY-MM-DD
    section Fase 1: Incepción & Specs
    Specs, Casos de Uso y Repo TrautsLab     :done, f1_1, 2026-08-17, 1d
    Prototipo Frontend y Accesibilidad        :done, f1_2, 2026-08-17, 1d

    section Fase 2: Memoria & Vault
    Estructura Vault (RAW/WIKI/OUTPUT)        :active, f2_1, 2026-08-18, 2d
    Mapa AGENTS.md e Indexador Jerárquico    :f2_2, after f2_1, 2d
    Estructura de Caché Tier 2 (JSON/MD)     :f2_3, after f2_2, 1d

    section Fase 3: Skills & Crons
    Framework Ejecutor de Skills             :f3_1, after f2_3, 2d
    Skill: morning-intel-scan (GitHub/HN)    :f3_2, after f3_1, 2d
    Skill: calendar-daily-brief               :f3_3, after f3_2, 1d
    Daemon Cron Matutino (launchd / node)    :f3_4, after f3_3, 1d

    section Fase 4: Pipeline de Voz Local
    Servicio STT (Faster-Whisper local)      :f4_1, after f3_4, 2d
    Servicio TTS (Kokoro TTS local)          :f4_2, after f4_1, 2d
    Enrutador Inteligente 3-Tier (Haiku)     :f4_3, after f4_2, 2d
    Daemon Hotkey Global macOS               :f4_4, after f4_3, 1d

    section Fase 5: Plugin Obsidian
    Scaffolding Plugin con Hot Reload        :f5_1, after f4_4, 2d
    Integración Dashboard UI en Obsidian     :f5_2, after f5_1, 2d
    Puente de Voz y Terminal en Obsidian     :f5_3, after f5_2, 2d

    section Fase 6: Acceso Móvil
    Túnel Seguro (Tailscale / Cloudflare)    :f6_1, after f5_3, 1d
    PWA Móvil & Bot Puente Telegram          :f6_2, after f6_1, 2d

    section Fase 7: Release v1.0.0
    Testing E2E, Optimización Tokens & Docs  :f7_1, after f6_2, 3d
```

---

## 🎯 Secuencia Detallada por Fases

---

### 🟢 FASE 1: Incepción, Diseño y Especificaciones (*COMPLETADA — v0.1.0-alpha.1*)
- [x] Documento fundacional de visión (`0-main-idea.md`).
- [x] Análisis de arquitectura móvil fuera de casa y costes (`1-mobile-remote-access-and-costs.md`).
- [x] Prototipo frontend interactivo con roles ARIA, atajos de teclado y simulación 3-Tier (`frontend/`).
- [x] Especificación formal de Casos de Uso y Requisitos Funcionales (`use-cases.md`).
- [x] Diagramas de arquitectura, componentes, secuencia y actividades (`diagrams.md`).
- [x] Repositorio en GitHub bajo la organización `trautslab/TrautsLab-OS` con SemVer, Changelog y Contributing.

---

### 🔵 FASE 2: Cimientos de Memoria y Navegación en el Vault (*COMPLETADA — v0.1.0-alpha.2*)
**Objetivo:** Crear el sistema de archivos que actuará como base de datos y memoria contextual de TrautsLab OS.

- [x] **Paso 2.1 — Estructura Física del Vault:** Creación de directorios estándar (`vault/RAW/`, `vault/WIKI/`, `vault/OUTPUT/cache/`) y notas iniciales con frontmatter.
- [x] **Paso 2.2 — Script de Indexación Jerárquica (`vault-indexer`):** Motor de indexado recursivo (`@trautslab/vault-engine`) que genera tablas de contenidos maestras y sub-índices por dominio temático.
- [x] **Paso 2.3 — Demonio Observador de Archivos (`vault-watcher`):** Observador en tiempo real con debounce de 500ms para reindexación incremental desatendida.
- [x] **Paso 2.4 — Esquema de Caché para Tier 2 y Lector Rápido:** Formato snapshot JSON (`today-intel.json`, `today-agenda.json`) y lector de resúmenes fonéticos para Kokoro TTS (<10ms).
- [x] **Paso 2.5 — Auditor de Salud (`vault-health`):** Verificador de integridad de notas y conformidad de YAML frontmatter.

---

> **Documento:** `docs/roadmap/implementation-roadmap.md`  
> **Proyecto:** TrautsLab OS  
> **Estado:** Fase 3 Completada  
> **Fecha y Hora:** 2026-08-17 10:53:30 (PET / UTC-5 - Hora Perú)  

---

### 🟣 FASE 3: Motor de Habilidades (Skills) y Automatizaciones (*COMPLETADA — v0.1.0-alpha.3*)
**Objetivo:** Desarrollar las primeras rutinas deterministas que alimentan de información al sistema cada mañana.

- [x] **Paso 3.1 — Framework Ejecutor de Skills:** Paquete `@trautslab/skills-engine` con `SkillRegistry`, métricas de ejecución y tipado extensible.
- [x] **Paso 3.2 — Skill `morning-intel-scan`:** Conectores con GitHub Search/Trending y Hacker News, generación de entregables en `RAW/` y `WIKI/`, y caché Tier 2 (`today-intel.json`).
- [x] **Paso 3.3 — Skill `calendar-daily-brief`:** Formateo de cronogramas y prioridades con resumen fonético para Kokoro TTS (`today-agenda.json`).
- [x] **Paso 3.4 — Skill `vault-sync-indexer`:** Reconstrucción bajo demanda de todas las tablas de contenidos e índices jerárquicos.
- [x] **Paso 3.5 — Planificador de Automatizaciones (Cron Daemon):** Motor `node-cron` para ejecución desatendida y generador de `.plist` para `launchd` de macOS (`com.trautslab.os.scheduler.plist`).

---

> **Documento:** `docs/roadmap/implementation-roadmap.md`  
> **Proyecto:** TrautsLab OS  
> **Estado:** Fase 4 Completada  
> **Fecha y Hora:** 2026-08-17 10:57:30 (PET / UTC-5 - Hora Perú)  

---

### 🟠 FASE 4: Pipeline de Voz Local e Híbrido (*COMPLETADA — v0.1.0-alpha.4*)
**Objetivo:** Permitir la interacción conversacional ultrarrápida mediante hotkey global y enrutamiento inteligente 3-Tier.

- [x] **Paso 4.1 — Servicio de Transcripción (STT):** Integración de `FasterWhisperSTTEngine` con soporte para modelos locales en GPU/MPS y fallback.
- [x] **Paso 4.2 — Servicio de Síntesis de Voz (TTS):** Integración de `KokoroTTSEngine` para síntesis de audio natural en español/inglés con latencia < 250ms.
- [x] **Paso 4.3 — Cerebro Enrutador (3-Tier Router):** Clasificador de intenciones (`VoiceIntentRouter`) que diferencia comandos directos (Tier 1), lecturas de caché en < 20ms (Tier 2) y agentes autónomos headless (Tier 3).
- [x] **Paso 4.4 — Orquestador de Pipeline & Servidor HTTP:** `VoicePipeline` y `VoiceServer` exponiendo endpoints REST/JSON para Obsidian y Web PWA.
- [x] **Paso 4.5 — CLI de Simulación y Pruebas:** Consola de ejecución de pruebas y validación de latencias (`npm run simulate`, `npm run query`).

---

### 🟡 FASE 5: Plugin de Obsidian (Centro de Mando Visual)
**Objetivo:** Integrar el dashboard interactivo dentro de Obsidian como plugin nativo.

1. **Paso 5.1 — Scaffolding del Plugin:**
   - Configurar proyecto de plugin Obsidian en TypeScript con soporte de desarrollo rápido (*Hot Reload*).
2. **Paso 5.2 — Migración del Dashboard UI:**
   - Portar la interfaz creada en `frontend/` (Glassmorphism, modo alto contraste, widgets en tiempo real) a una vista personalizada (*Custom View*) en Obsidian.
3. **Paso 5.3 — Conexión Bidireccional:**
   - Conectar los botones de la UI con el motor de skills, el log de ejecución en tiempo real y el Voice Orb.

---

### 📱 FASE 6: Acceso Remoto Móvil y Asistente en la Calle
**Objetivo:** Permitir el uso de TrautsLab OS desde el teléfono celular fuera de casa.

1. **Paso 6.1 — Configuración del Túnel Seguro:**
   - Despliegue de túnel privado con **Tailscale** o **Cloudflare Zero Trust** para conectar el smartphone con el Mac de casa de forma cifrada y sin abrir puertos.
2. **Paso 6.2 — PWA Móvil & Bot de Telegram/WhatsApp:**
   - Configuración del frontend como PWA instalable en iOS/Android.
   - Creación de un bot privado de Telegram como interfaz de respaldo para notas de voz sobre la marcha.

---

### 🏁 FASE 7: Optimización, Evaluaciones y Release v1.0.0 Estable
**Objetivo:** Asegurar la robustez, determinismo y eficiencia del sistema completo.

1. **Paso 7.1 — Auditoría de Tokens y Latencias:**
   - Medición de reducción de consumo de tokens y verificación de latencias (< 800ms en respuestas de voz Tier 2).
2. **Paso 7.2 — Self-Improving Loops:**
   - Mecanismos de refinamiento continuo de prompts y evaluación de calidad de los reportes generados.
3. **Paso 7.3 — Publicación de Versión Estable:**
   - Actualización de changelog y etiquetado de la versión `v1.0.0`.
