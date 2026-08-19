# Diagrama de Arquitectura Global y Topología de Capas

> **ID:** `ARCH-01` | **Categoría:** Topología Global  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)  
> **Estándar Horario:** `PET / UTC-5 - Hora Perú`

---

## 🏛️ Topología de Capas del Sistema

Representa la interacción integral entre la capa de cliente, los túneles seguros, el pipeline de voz acelerado por Metal, el motor de ejecución 3-Tier y la capa de memoria jerárquica en el Vault:

```mermaid
graph TB
    subgraph Client_Layer ["Capa de Cliente & Captura"]
        direction TB
        User([👤 Usuario / Jhonny])
        Hotkey[⌨️ Hotkey Global macOS: Cmd+Shift+Space]
        WebUI["🖥️ Dashboard Web HUD / PWA (:3000)"]
        TauriShell["💻 App Desktop Nativa Tauri v2 & Tray"]
        MobileClient["📱 Telegram Bot (@TrautsLabBot)"]
        MCPAgent["🤖 Agente LLM / Antigravity / Claude Code"]
    end

    subgraph Transport_Layer ["Capa de Transporte & Protocolos"]
        Tailscale["🔒 Red Privada Mesh (Tailscale)"]
        StdioProtocol["⚡ Protocolo JSON-RPC 2.0 (stdio)"]
        SSEChannel["📡 Stream Server-Sent Events (:3030/api/events/live)"]
    end

    subgraph Voice_Pipeline ["Pipeline de Audio Local"]
        STT["🎙️ Whisper Large v3 Turbo (GPU Metal)"]
        Router["🎯 Enrutador Semántico LLM (qwen2.5:3b)"]
        TTS["🔊 Kokoro TTS (Síntesis Fonética)"]
    end

    subgraph Execution_Engine ["Motor de Ejecución de 3 Niveles"]
        MCPServer["🚀 Servidor MCP (@trautslab/mcp-server)"]
        SkillEngine["⚡ Motor de Skills Deterministas (Tier 1)"]
        ReportCache["📑 Consultor de Caché Ultrarrápido (Tier 2, <20ms)"]
        HeadlessAgent["🤖 Agente Autónomo CLI (Tier 3 / Ollama)"]
    end

    subgraph Storage_Layer ["Capa de Memoria Vault (Patrón Karpathy)"]
        VaultRaw[("📁 RAW/ (Ingesta Cruda)")]
        VaultWiki[("📁 WIKI/ + index.md (Conocimiento Estructurado)")]
        VaultOutput[("📁 OUTPUT/ (Agendas, Diarios y Caché JSON)")]
        NavigationMap[("📄 AGENTS.md / WIKI/index.md")]
    end

    User --> Hotkey & WebUI & TauriShell & MobileClient
    MCPAgent --> StdioProtocol --> MCPServer

    MobileClient -.-> Tailscale
    Tailscale -.-> STT

    Hotkey & WebUI & TauriShell --> STT
    STT -->|Texto Transcrito| Router

    Router -->|Tier 1: Comando Directo| SkillEngine
    Router -->|Tier 2: Lectura Inmediata| ReportCache
    Router -->|Tier 3: Tarea Compleja| HeadlessAgent

    MCPServer --> SkillEngine & ReportCache & VaultWiki

    ReportCache --> VaultOutput
    SkillEngine --> VaultRaw & VaultOutput & VaultWiki
    HeadlessAgent --> Storage_Layer

    Router -->|Texto de Respuesta| TTS
    TTS -->|Audio Sintetizado| User
    SkillEngine -.->|Mutaciones| SSEChannel -.-> WebUI & TauriShell
```

---
[⬅️ Volver al Índice de Diagramas](./index.md)
