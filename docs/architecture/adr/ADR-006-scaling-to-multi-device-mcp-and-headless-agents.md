# ADR-006: Estrategia de Escalabilidad: Protocolo MCP, Agentes Headless y Múltiples Dispositivos

> **Estado:** PROPUESTO / EN ROADMAP  
> **Fecha:** 2026-08-19 (PET / UTC-5 - Hora Perú)  
> **Autores:** Jhonny Lorenzo (`jlorenzor`)  
> **Dominio:** Escalabilidad / Integración con Agentes / Multi-Device

---

## 1. Contexto y Visión de Futuro

A medida que TrautsLab OS evoluciona, surgen nuevas demandas de integración:
1. **Acceso desde herramientas de desarrollo:** IDEs como Antigravity o Claude Code necesitan consultar la memoria del Vault y disparar habilidades de TrautsLab OS mediante un protocolo estándar.
2. **Ejecución desatendida de tareas complejas (Tier 3):** Delegar tareas que requieren múltiples pasos (ej: generar un informe técnico de 20 páginas o clonar y analizar un repositorio) sin bloquear la interfaz de usuario.
3. **Topología multi-dispositivo:** Acceder al mismo cerebro operativo desde la MacBook portátil, el iPhone, y la estación de trabajo fija.

---

## 2. Decisión Arquitectónica y Hoja de Ruta de Escalado

1. **Implementación de Servidor MCP (Model Context Protocol):**
   - Crear el paquete `@trautslab/mcp-server` que exponga las herramientas del sistema (`vault_read`, `vault_write`, `schedule_event`, `archive_event`, `scan_intel`, `send_telegram_notification`) como recursos y herramientas estándar de MCP sobre `stdio` y `SSE`.
2. **Orquestación de Agentes Headless (Tier 3):**
   - Integrar un ejecutor de sub-agentes desatendidos con `launchd` / subprocesos aislados que comuniquen su progreso vía Server-Sent Events y notifiquen la conclusión por Telegram y síntesis de voz.
3. **Topología de Red Mesh con Tailscale:**
   - Despliegue de túnel privado con IP fija de MagicDNS (ej: `mac-studio.trautslab.ts.net:3000`) para acceso PWA seguro sin exponer puertos públicos.
4. **Persistencia y Motor de Búsqueda Vectorial Híbrido (BM25 + Embeddings):**
   - Mantener Markdown como formato fuente y generar índices vectoriales ligeros locales (LanceDB / SQLite-vec) para búsqueda semántica profunda en notas extensas.

---

## 3. Consecuencias y Beneficios

- **Interoperabilidad absoluta:** Cualquier agente (Antigravity, Claude Code, Cursor, terminal local) puede interactuar de forma nativa con TrautsLab OS.
- **Cero bloqueo de interfaz:** Los flujos complejos corren en segundo plano con telemetría en tiempo real.
- **Escalabilidad de conocimiento:** Soporta millones de palabras en el Vault sin degradar la latencia de respuesta por voz.
