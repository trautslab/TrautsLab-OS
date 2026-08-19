# Diagrama de Secuencia: Ejecución de Herramientas MCP para Agentes LLM

> **ID:** `SEQ-08` | **Categoría:** Diagramas de Secuencia  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)  
> **Estándar Horario:** `PET / UTC-5 - Hora Perú`

---

## 🔄 Flujo de Ejecución

```mermaid
sequenceDiagram
    autonumber
    actor Agent as Antigravity / Claude Code
    participant MCPServer as TrautsLab MCP Server (stdio)
    participant Registry as MCP Tools Registry
    participant SkillEngine as Skills Engine (Tier 1)
    participant Vault as Obsidian Vault

    Agent->>MCPServer: {"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "trautslab_calendar_add_event", "arguments": {...}}}
    MCPServer->>Registry: executeTool("trautslab_calendar_add_event", args)
    Registry->>SkillEngine: execute("calendar-add-event", ctx)
    SkillEngine->>Vault: Escribe fila en daily-agenda-YYYY-MM-DD.md
    SkillEngine-->>Registry: SkillResult { success: true, message: "✓ He agendado..." }
    Registry-->>MCPServer: MCPToolResult { content: [{ type: "text", text: "..." }] }
    MCPServer-->>Agent: {"jsonrpc": "2.0", "result": {...}}
```

---
[⬅️ Volver al Índice de Diagramas](../index.md)
