# 🛠️ Guía de Fork & Personalización: Transformando LikeC4 con el Diseño de IcePanel

Esta guía documenta la hoja de ruta técnica para **forkear [LikeC4](https://github.com/likec4/likec4)** y personalizar su interfaz de usuario (UI/UX) para que adopte el diseño visual y canvas de **IcePanel**, aprovechando su servidor **MCP nativo, gratuito y sin cuotas**.

---

## 🏗️ 1. Anatomía del Monorepo de LikeC4

LikeC4 es un monorepo administrado con **pnpm workspaces** y **TypeScript**. Sus paquetes clave son:

```
likec4/ (Monorepo)
├── packages/
│   ├── core/               # AST del lenguaje C4, modelos de datos, parsing y cálculo de layout
│   ├── diagram/            # Componentes React del Canvas interactivo (construido sobre Panda CSS + React Flow)
│   ├── layouts/            # Algoritmos de auto-layout (Dagre / Graphviz WebAssembly)
│   ├── mcp/                # Servidor oficial Model Context Protocol (MCP) para LLMs y Agentes
│   └── cli/                # Binario CLI (`likec4 start`, `likec4 build`, `likec4 mcp`)
```

---

## 🎨 2. Puntos Exactos de Inyección para el Estilo IcePanel

### A. Paleta de Colores y Tokens en Panda CSS (`packages/diagram`)
IcePanel utiliza un fondo oscuro profundo con bordes neón suaves y tarjetas limpias:
* **Fondo Canvas:** `#0B0F19` (o `#0F172A` Slate Dark)
* **Rejilla (Dot Grid):** Puntos sutiles en `#1E293B`
* **Tarjetas de Componentes:**
  * Fondo: `#1E293B` (80% opacidad con backdrop blur)
  * Borde: 1px sólido con color de arquetipo (`#EF4444` Command, `#22C55E` Query, `#06B6D4` Projection, `#F59E0B` Plug, `#A855F7` Saga)
  * Header con "Pill Badge" para la tecnología (ej. `Node.js 20`, `AWS Lambda`)

* **Archivo a modificar:** `packages/diagram/src/theme/tokens.ts` y `packages/diagram/src/panda.config.ts`.

### B. Renderizador de Nodos / Tarjetas (`packages/diagram/src/base/primitives/element/`)
En IcePanel, cada tarjeta tiene:
1. **Icono / Arquetipo:** Esquina superior izquierda.
2. **Título del Repositorio:** Tipografía clara (`Inter` o `JetBrains Mono`).
3. **Pill de Tecnología:** Rectángulo redondeado pequeño en la esquina superior derecha (`Node.js`, `Go`, `Step Functions`).
4. **Descripción funcional:** 2 líneas con el resumen de responsabilidad BIAN.
5. **Handles / Puertos de Conexión:** Puntos magnéticos circulares a los costados.

* **Archivo a modificar:** `packages/diagram/src/base/primitives/element/ElementNode.tsx`.

### C. Conexiones y Flujos Dinámicos (`packages/diagram/src/base/primitives/edge/`)
IcePanel destaca por sus flechas animadas con "partículas de datos" durante los flujos interactivos.
* **Archivo a modificar:** `packages/diagram/src/base/primitives/edge/Edge.tsx` para agregar la animación SVG `stroke-dasharray` / `stroke-dashoffset` en las vistas dinámicas (`dynamic view`).

---

## 🤖 3. Servidor MCP Nativo de LikeC4 (`packages/mcp`)

LikeC4 ya incluye una implementación completa de MCP en `packages/mcp`. Expone al agente LLM:

| Herramienta MCP | Descripción |
| :--- | :--- |
| `read-project-summary` | Devuelve el total de elementos, relaciones, tags y vistas C4 disponibles. |
| `search-element` | Búsqueda semántica de microservicios o almacenes por nombre o tecnología. |
| `read-view` | Devuelve el grafo completo de una vista C4 (incluyendo los flujos dinámicos). |
| `query-graph` | Permite al LLM consultar dependencias aguas arriba y aguas abajo. |

### Cómo levantar el MCP de LikeC4 en tu máquina:
```bash
npx likec4 mcp likec4/src
# O mediante el Makefile del laboratorio:
make likec4-mcp
```

Para conectarlo a **Cursor** o **Claude Code**, configuras en `settings.json`:
```json
{
  "mcpServers": {
    "likec4-architecture": {
      "command": "npx",
      "args": ["-y", "likec4", "mcp", "/Users/jlorenzor/Documents/AWS-Flossy-Local-IcePanels/likec4/src"]
    }
  }
}
```

---

## 🚀 4. Pasos para Clonar, Modificar y Probar tu Fork

1. **Clonar el repositorio oficial de LikeC4:**
   ```bash
   git clone https://github.com/likec4/likec4.git likec4-icepanel-custom
   cd likec4-icepanel-custom
   pnpm install
   ```

2. **Iniciar el entorno de desarrollo:**
   ```bash
   pnpm dev
   ```

3. **Modificar los estilos de las tarjetas:**
   Dirígete a `packages/diagram/src/base/primitives/element/` y ajusta los componentes React para replicar la estructura visual de IcePanel.

4. **Compilar y enlazar localmente:**
   ```bash
   pnpm build
   pnpm link --global
   ```

5. **Utilizarlo directamente en este laboratorio:**
   En este repositorio, el archivo [`likec4/src/architecture.c4`](file:///Users/jlorenzor/Documents/AWS-Flossy-Local-IcePanels/likec4/src/architecture.c4) ya está 100% generado y validado con los 11 dominios BIAN, 80 repositorios y los 20 flujos.

