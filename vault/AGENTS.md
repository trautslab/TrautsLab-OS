# AGENTS.md — Mapa de Navegación del Vault (Patrón Karpathy)

> **Instrucciones para Agentes Autónomos (Claude Code / Local LLMs):**  
> Este documento define las reglas de acceso, lectura, escritura e indexación de notas en este repositorio.

---

## 🗺️ Estructura Jerárquica de Carpetas

```text
vault/
├── RAW/                      # Ingesta cruda: artículos sin editar, transcripciones, datos descargados.
│   └── [YYYY-MM-DD]-[nombre].md
├── WIKI/                     # Conocimiento estructurado y sintetizado estilo enciclopedia.
│   ├── index.md              # TABLA DE CONTENIDOS MAESTRA (Leer siempre primero).
│   ├── ai-systems/           # Modelos de lenguaje, agentes, inferencia local y STT/TTS.
│   │   └── index.md          # Sub-índice temático de IA.
│   ├── productivity/         # Rutinas de trabajo, metodologías, organización personal.
│   │   └── index.md          # Sub-índice de productividad.
│   ├── development/          # Arquitecturas de software, plugins y APIs.
│   │   └── index.md          # Sub-índice de desarrollo.
│   └── operations/           # Infraestructura, túneles, backups y automatizaciones.
│       └── index.md          # Sub-índice de operaciones.
├── OUTPUT/                   # Entregables y reportes finales listos para consumo del usuario.
│   ├── reports/              # Reportes de investigación o resúmenes diarios.
│   └── cache/                # Almacén snapshot JSON para respuestas instantáneas de voz (Tier 2).
│       ├── today-intel.json  # Noticia y tendencias destacadas de hoy.
│       └── today-agenda.json # Compromisos y prioridades del día.
└── AGENTS.md                 # Este mapa de navegación.
```

---

## 🧭 Reglas de Navegación para Agentes (Ahorro de Tokens)

1. **PROHIBIDO el escaneo ciego:** NUNCA ejecutes búsquedas globales no filtradas (`grep` o listado total de miles de archivos) sin antes consultar los índices.
2. **Protocolo de Lectura en 2 Saltos:**
   - **Salto 1:** Lee `WIKI/index.md` para identificar la categoría temática correspondiente.
   - **Salto 2:** Lee el `index.md` de la subcategoría específica (ej. `WIKI/ai-systems/index.md`) para ubicar la nota exacta.
   - **Salto 3:** Accede directamente al archivo de destino.
3. **Formato Frontmatter Obligatorio:** Toda nueva nota creada en `WIKI/` o `RAW/` debe incluir el encabezado YAML:
   ```yaml
   ---
   title: "Título Descriptivo"
   domain: "ai-systems | productivity | development | operations"
   created_at: "YYYY-MM-DD"
   updated_at: "YYYY-MM-DD"
   tags: ["tag1", "tag2"]
   summary: "Resumen de 1-2 oraciones del contenido del archivo."
   ---
   ```
4. **Almacenamiento de Caché (Tier 2):** Si una skill genera un resumen de uso frecuente para el asistente de voz, debe guardarlo en `OUTPUT/cache/[nombre].json` con un campo `quick_summary_tts` de menos de 30 palabras.
