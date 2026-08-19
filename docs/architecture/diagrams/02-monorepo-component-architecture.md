# Diagrama de Componentes del Monorepo

> **ID:** `ARCH-02` | **Categoría:** Arquitectura de Componentes  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)  
> **Estándar Horario:** `PET / UTC-5 - Hora Perú`

---

## 🧩 Estructura Modular de Paquetes

Desglose modular de las dependencias y responsabilidades de los paquetes de TrautsLab OS bajo el Principio de Responsabilidad Única (SRP):

```mermaid
graph LR
    subgraph Frontend_App ["frontend / Client"]
        UI_Core["Dashboard Controller (app.js)"]
        UI_Sphere["Esfera 3D (sphere-canvas.js)"]
        UI_SSE["Cliente SSE EventSource (/api/events/live)"]
    end

    subgraph Desktop_Shell ["packages/desktop-app"]
        Tauri_Rust["Tauri v2 Main Process (Rust)"]
        Tauri_Tray["System Tray & Menu Bar"]
        Tauri_Hotkey["Global Hotkey (Cmd+Shift+Space)"]
    end

    subgraph MCP_Package ["packages/mcp-server"]
        MCP_Server["MCPServer (JSON-RPC 2.0)"]
        MCP_Tools["10 Tools Tipadas"]
    end

    subgraph Voice_Package ["packages/voice-engine"]
        Voice_Server["VoiceServer (:3030)"]
        Voice_Pipeline["VoicePipeline (3-Tier Orchestrator)"]
        Voice_STT["FasterWhisperSTTEngine"]
        Voice_Router["LLMIntentRouter (qwen2.5:3b)"]
        Voice_TTS["KokoroTTSEngine"]
    end

    subgraph Telegram_Package ["packages/telegram-bridge"]
        TG_Poller["TelegramPoller Daemon"]
        TG_Whisper["AudioTranscriber (Whisper Metal)"]
        TG_Notifier["sendTelegramNotification"]
    end

    subgraph Skills_Package ["packages/skills-engine"]
        Skill_Registry["SkillRegistry (7 Skills Registradas)"]
        Skill_Cron["Automation Scheduler (node-cron / launchd)"]
    end

    subgraph Vault_Package ["packages/vault-engine"]
        Vault_Indexer["VaultIndexer (Hierarchical index.md)"]
        Vault_Watcher["VaultWatcher (Chokidar 500ms Debounce)"]
        Vault_HybridSearch["HybridSearchEngine (BM25 + Ollama)"]
        Vault_Cache["Tier2CacheManager (<20ms Read)"]
    end

    Frontend_App --> Voice_Server
    Desktop_Shell --> Frontend_App
    Desktop_Shell --> Voice_Server
    MCP_Package --> Skills_Package & Vault_Package
    Voice_Package --> Skills_Package & Vault_Package
    Telegram_Package --> Voice_Package & TG_Whisper & TG_Notifier
    Skills_Package --> TG_Notifier & Vault_Package
```

---
[⬅️ Volver al Índice de Diagramas](./index.md)
