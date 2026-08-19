# TrautsLab Horizon — Design System Tokens & Color Palette

> **Design System:** TrautsLab Horizon UI  
> **Versión:** 1.2.0  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)

---

## 🎨 1. Filosofía y Principios de Diseño

1. **Aeroespacial & Cyber Void:** Inspirado en consolas de misión y centros de comando avanzados.
2. **Local-First & Telemetría en Tiempo Real:** Prioridad a la densidad de información legible, indicadores lumínicos de estado y contraste óptico.
3. **Accesibilidad Universal:** Cumplimiento total de **WCAG AAA** en modo de alto contraste y ratios de luminancia superiores a 7:1 en texto.

---

## 🌌 2. Paleta de Colores Oficial

### A. Modo Oscuro (*Obsidian Void & Cyber Amber*)
| Token CSS | Hex / HSL | Rol / Uso Semántico |
| :--- | :---: | :--- |
| `--bg-deep` | `#07090e` | Fondo maestro del viewport |
| `--bg-surface` | `#0d1117` | Tarjetas, paneles y modales principales |
| `--bg-surface-elevated` | `#151b23` | Tooltips, popovers y drawers flotantes |
| `--bg-glass` | `rgba(13, 17, 23, 0.75)` | Fondos con efecto *backdrop-filter: blur(14px)* |
| `--accent-amber` | `#f59e0b` | Acento maestro primario y selección activa |
| `--accent-amber-glow` | `#fbbf24` | Resplandor neón, focos y vitals de hardware |
| `--signal-cyan` | `#06b6d4` | Canales MCP, embeddings y grafos vectoriales |
| `--signal-green` | `#10b981` | Conexión en línea, tareas completadas y crons |
| `--signal-indigo` | `#6366f1` | Cuadrilla multi-agente HyperAgent Tier 3 |
| `--signal-rose` | `#f43f5e` | Fallos, excepciones y alertas críticas |
| `--text-bright` | `#ffffff` | Títulos y valores numéricos clave |
| `--text-primary` | `#f8fafc` | Texto de lectura y párrafos |
| `--text-muted` | `#94a3b8` | Metadatos, etiquetas secundarias y timestamps |
| `--text-dim` | `#64748b` | Placeholders y bordes pasivos |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Separadores de cuadrícula |

---

### B. Modo Claro (*Pure Slate & Warm Amber*)
| Token CSS | Hex / HSL | Rol / Uso Semántico |
| :--- | :---: | :--- |
| `--bg-deep` | `#f8fafc` | Fondo base claro (*Slate 50*) |
| `--bg-surface` | `#ffffff` | Tarjetas y contenedores con elevación sutil |
| `--bg-surface-elevated` | `#f1f5f9` | Paneles secundarios |
| `--accent-amber` | `#d97706` | Acento cálido de alto contraste |
| `--text-primary` | `#0f172a` | Texto de máxima legibilidad (*Slate 900*) |
| `--text-muted` | `#475569` | Texto secundario (*Slate 600*) |
| `--border-subtle` | `#e2e8f0` | Delimitadores de bordes limpios |

---

### C. Modo Alto Contraste (*WCAG AAA*)
- Fondo: `#000000` absoluto.
- Texto: `#ffffff` y `#ffb700` de máxima luminancia.
- Bordes: `2px solid #ffffff`.

---

## 📐 3. Tipografía & Escala Espacial

- **Tipografía de Interfaz:** `system-ui, -apple-system, 'SF Pro Display', 'Inter', sans-serif`
- **Tipografía de Telemetría & Código:** `'SF Mono', 'JetBrains Mono', 'Menlo', 'Fira Code', monospace`
- **Escala de Espaciado:** `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`
- **Bordes Redondeados (*Radius*):**
  - `--radius-sm`: `4px`
  - `--radius-md`: `8px`
  - `--radius-lg`: `12px`
