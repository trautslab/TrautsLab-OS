# Diagrama de Secuencia: Observación en Tiempo Real e Indexación Incremental

> **ID:** `SEQ-04` | **Categoría:** Diagramas de Secuencia  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)  
> **Estándar Horario:** `PET / UTC-5 - Hora Perú`

---

## 🔄 Flujo de Ejecución

```mermaid
sequenceDiagram
    autonumber
    actor Usuario_o_Agente as Usuario / Agente CLI / MCP
    participant Vault as Sistema de Archivos Vault
    participant Watcher as Vault Watcher Daemon (Chokidar)
    participant Parser as Frontmatter Parser & Linter
    participant Indexer as Hierarchical Indexer
    participant Cache as Tier 2 Cache Store

    Usuario_o_Agente->>Vault: Crea o modifica archivo (ej. WIKI/ai/rag.md)
    Vault-->>Watcher: Emite evento FS (add/change/unlink)
    Note over Watcher: Aplica debounce (500ms) para evitar sobrecarga
    Watcher->>Parser: Extrae frontmatter YAML (título, resumen, tags)
    Parser-->>Indexer: Metadatos normalizados
    Indexer->>Vault: Actualiza sub-índice WIKI/ai/index.md
    Indexer->>Vault: Actualiza índice maestro WIKI/index.md
    Indexer->>Cache: Actualiza snapshot de navegación
    Watcher-->>Usuario_o_Agente: Emite log "✓ Vault re-indexed successfully"
```

---
[⬅️ Volver al Índice de Diagramas](../index.md)
