# Guía de Onboarding e Integración MCP para Agentes LLM

> **Servidor:** `@trautslab/mcp-server`  
> **Protocolo:** Model Context Protocol (JSON-RPC 2.0 / 2024-11-05)  
> **Transportes Soportados:** `stdio` (estándar), `SSE`  
> **Comando de Ejecución:** `npx -y @trautslab/mcp-server` o `npx tsx packages/mcp-server/src/cli.ts`

---

## 🤖 1. Configuración Rápida para Clientes y Agentes de IA

### A. Para Google Antigravity / Gemini CLI (`~/.gemini/config/mcp_config.json` o `.agents/mcp_config.json`):
```json
{
  "mcpServers": {
    "trautslab-os": {
      "command": "npx",
      "args": ["tsx", "/Users/jlorenzor/Documents/TrautsLab-OS/packages/mcp-server/src/cli.ts"],
      "env": {
        "OBSIDIAN_VAULT_ROOT": "/Users/jlorenzor/Documents/Obsidian Vault"
      }
    }
  }
}
```

### B. Para Claude Desktop / Claude Code (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "trautslab": {
      "command": "node",
      "args": ["/Users/jlorenzor/Documents/TrautsLab-OS/packages/mcp-server/dist/cli.js"],
      "env": {
        "OBSIDIAN_VAULT_ROOT": "/Users/jlorenzor/Documents/Obsidian Vault"
      }
    }
  }
}
```

### C. Para Cursor / Windsurf / Cline:
- Tipo: `command`
- Comando: `npx tsx /Users/jlorenzor/Documents/TrautsLab-OS/packages/mcp-server/src/cli.ts`

---

## 🛠️ 2. Catálogo Detallado de las 10 Herramientas MCP

| Nombre de la Tool | Parámetros Clave | Descripción para el LLM |
| :--- | :--- | :--- |
| **`trautslab_vault_read`** | `relativePath` (string) | Lee cualquier nota en Markdown con su frontmatter YAML íntegro. |
| **`trautslab_vault_search`** | `query` (string), `limit` (number) | Búsqueda léxica (BM25) por palabras clave y tags en todo el Vault. |
| **`trautslab_vault_semantic_search`** | `query` (string), `topK` (number) | Búsqueda semántica híbrida combinando embeddings locales y BM25. |
| **`trautslab_vault_reindex`** | *(ninguno)* | Escanea el Vault y reconstruye todas las tablas de contenidos `index.md`. |
| **`trautslab_calendar_get_agenda`** | `date` (YYYY-MM-DD, opcional) | Obtiene el cronograma estructurado y tareas del día. |
| **`trautslab_calendar_add_event`** | `title`, `date`, `time`, `location`, `priority` | Agenda un nuevo evento en Markdown y actualiza la caché Tier 2. |
| **`trautslab_calendar_edit_event`** | `date`, `originalText`, `newTitle`, `newTime`, `newLocation` | Modifica in-place una fila de la agenda sin alterar la estructura. |
| **`trautslab_calendar_archive`** | `action` (`archive_all`/`archive_one`), `title`, `date` | Archiva compromisos individuales o limpia la jornada completa. |
| **`trautslab_morning_intel_scan`** | *(ninguno)* | Raspa GitHub Trending y Hacker News, generando el informe en WIKI. |
| **`trautslab_telegram_notify`** | `message`, `title`, `delayMinutes`, `priority` | Despacha push inmediato o temporizador diferido a Telegram. |

---

## 📖 3. Recursos Estándar (MCP Resources)

El servidor expone automáticamente los siguientes recursos de lectura directa:
- `vault://WIKI/index.md` — Tabla de contenidos maestra con enlaces a todas las notas.
- `vault://AGENTS.md` — Mapa de navegación y directrices del sistema.
