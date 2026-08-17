# TrautsLab OS — Diagramas de Arquitectura, Componentes, Secuencia y Actividades

> **Documento:** `docs/architecture/diagrams.md`  
> **Proyecto:** TrautsLab OS  
> **Versión:** 1.0.0-alpha.1  
> **Fecha:** 2026-08-17  

Este documento reúne las representaciones formales del sistema en **Mermaid** estructuradas en cuatro vistas arquitectónicas:
1. Diagrama de Arquitectura Global
2. Diagrama de Componentes
3. Diagramas de Secuencia (Flujo de Voz 3-Tier, Automatización Cron y Agente Headless)
4. Diagramas de Actividades

---

## 1. Diagrama de Arquitectura Global

Representa la topología de capas del sistema, desde la captura en cliente hasta el almacenamiento persistente en el Vault.

```mermaid
graph TB
    subgraph Client_Layer ["Capa de Cliente & Captura"]
        direction TB
        User([👤 Usuario])
        Hotkey[⌨️ Hotkey Global / Espacio]
        WebUI["🖥️ Dashboard Web / PWA (Frontend)"]
        ObsidianPlugin["🔌 Plugin Obsidian (Command Center)"]
        MobileClient["📱 Cliente Móvil / Telegram Bot"]
    end

    subgraph Tunnel_Layer ["Capa de Transporte Seguro"]
        Tailscale["🔒 Red Privada Mesh (Tailscale)"]
        Cloudflare["🛡️ Cloudflare Zero Trust Tunnel"]
    end

    subgraph Voice_Pipeline ["Pipeline de Audio Local"]
        STT["🎙️ Faster-Whisper (STT Local GPU/CPU)"]
        Router["🎯 Brain Router (Claude 3.5 Haiku / Qwen Local)"]
        TTS["🔊 Kokoro TTS (Síntesis de Voz Local)"]
    end

    subgraph Execution_Engine ["Motor de Ejecución"]
        SkillEngine["⚡ Motor de Skills & Crons (Tier 1)"]
        ReportCache["📑 Consultor de Reportes en Caché (Tier 2)"]
        HeadlessAgent["🤖 Agente CLI Headless (Tier 3)"]
    end

    subgraph Storage_Layer ["Capa de Memoria & Vault (Patrón Karpathy)"]
        VaultRaw[("📁 RAW/ (Ingesta Cruda)")]
        VaultWiki[("📁 WIKI/ + index.md (Conocimiento Estructurado)")]
        VaultOutput[("📁 OUTPUT/ (Entregables & Reportes)")]
        NavigationMap[("📄 AGENTS.md / CLAUDE.md")]
    end

    User --> Hotkey
    User --> WebUI
    User --> ObsidianPlugin
    User --> MobileClient

    MobileClient -.-> Tailscale & Cloudflare
    Tailscale & Cloudflare -.-> STT

    Hotkey & WebUI & ObsidianPlugin --> STT
    STT -->|Texto Transcrito| Router
    
    Router -->|Tier 1: Comando Directo| SkillEngine
    Router -->|Tier 2: Lectura Rápida| ReportCache
    Router -->|Tier 3: Tarea Compleja| HeadlessAgent

    ReportCache --> VaultOutput
    ReportCache --> VaultWiki
    SkillEngine --> VaultRaw & VaultOutput
    HeadlessAgent --> Storage_Layer

    Router -->|Texto de Respuesta| TTS
    TTS -->|Audio Sintetizado| User
```

---

## 2. Diagrama de Componentes

Desglose modular de las librerías, subsistemas y dependencias de TrautsLab OS.

```mermaid
graph LR
    subgraph Frontend_Components ["Módulo UI / Frontend"]
        UI_Core["Dashboard Controller (app.js)"]
        UI_View["Views: Overview / Intel / Skills / Memory"]
        UI_VoiceOrb["Voice Orb Visualizer & A11y Controller"]
        UI_Terminal["Embedded Shell Drawer"]
    end

    subgraph Audio_Components ["Módulo de Voz"]
        Audio_Recorder["Audio Capture Stream"]
        Audio_STT["Faster-Whisper Inference Engine"]
        Audio_Router["3-Tier Intent Classifier"]
        Audio_TTS["Kokoro TTS Audio Generator"]
    end

    subgraph Automation_Components ["Módulo de Automatización"]
        Cron_Scheduler["Cron Scheduler (Node-cron / launchd)"]
        Skill_Registry["Skill Registry & Script Runner"]
        External_APIs["Google Calendar / GitHub / HN Fetchers"]
    end

    subgraph Knowledge_Components ["Módulo de Memoria (Vault)"]
        Vault_Watcher["Vault File Watcher"]
        Vault_Indexer["Hierarchical index.md Generator"]
        Agent_Interface["CLI Agent Bridge (Claude Code / Local LLM)"]
    end

    UI_Core --> UI_View & UI_VoiceOrb & UI_Terminal
    UI_VoiceOrb --> Audio_Recorder
    Audio_Recorder --> Audio_STT
    Audio_STT --> Audio_Router
    Audio_Router --> Audio_TTS
    Audio_Router --> Skill_Registry
    Audio_Router --> Knowledge_Components
    Audio_Router --> Agent_Interface

    Cron_Scheduler --> Skill_Registry
    Skill_Registry --> External_APIs
    Skill_Registry --> Knowledge_Components
    Knowledge_Components --> Vault_Indexer
```

---

## 3. Diagramas de Secuencia

### 3.1. Flujo de Interacción por Voz y Enrutamiento 3-Tier

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant UI as Voice Orb / Hotkey
    participant STT as Faster-Whisper (STT)
    participant Router as LLM Router (Haiku)
    participant Tier2 as Cache / Vault Report
    participant TTS as Kokoro TTS
    
    Usuario->>UI: Presiona Hotkey / Habla ("¿Qué tengo en agenda hoy?")
    UI->>STT: Envía buffer de audio PCM
    STT->>Router: Retorna texto ("¿Qué tengo en agenda hoy?")
    
    Note over Router: Clasifica intención -> Tier 2 (Lectura de Caché)
    
    Router->>Tier2: Consulta OUTPUT/daily-agenda-today.md
    Tier2-->>Router: Contenido estructurado de compromisos
    Router->>TTS: Genera respuesta textual resumida
    TTS-->>UI: Retorna stream de audio WAV/MP3
    UI-->>Usuario: Reproduce respuesta auditiva en < 800ms
```

### 3.2. Automatización Matutina (*Daily Intel Cron*)

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Cron Scheduler (08:00 AM)
    participant Skill as morning-intel-scan
    participant External as GitHub / HackerNews APIs
    participant RAW as Vault/RAW/
    participant WIKI as Vault/WIKI/
    participant Indexer as Vault Indexer

    Cron->>Skill: Dispara ejecución programada
    Skill->>External: Consulta tendencias (7d GitHub + Top HN)
    External-->>Skill: JSONs de datos crudos
    Skill->>RAW: Almacena RAW/2026-08-17-intel-data.json
    Skill->>WIKI: Sintetiza y crea WIKI/2026-08-17-morning-intel.md
    Skill->>Indexer: Solicita actualización de índices
    Indexer->>WIKI: Regenera WIKI/index.md con nuevos enlaces
    Skill-->>Cron: Reporta ejecución completada (Caché Tier 2 lista)
```

### 3.3. Tarea Compleja con Agente Headless (Tier 3)

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant Router as LLM Router
    participant Agent as Agente Headless CLI
    participant Vault as Vault Storage
    participant TTS as Kokoro TTS

    Usuario->>Router: "Investiga a fondo arquitecturas de voz local y genera reporte"
    Note over Router: Clasifica intención -> Tier 3 (Headless Agent)
    Router->>Agent: Lanza subproceso asíncrono con objetivo
    Router->>TTS: "He lanzado la investigación en segundo plano. Te avisaré al finalizar."
    TTS-->>Usuario: Notificación por voz inmediata
    
    Note over Agent: Agente investiga, sintetiza y escribe archivos
    Agent->>Vault: Escribe OUTPUT/research-local-voice-arch.md
    Agent->>TTS: Emite evento de finalización
    TTS-->>Usuario: "El reporte de investigación ya está listo en tu carpeta OUTPUT."
```

---

## 4. Diagramas de Actividades

### 4.1. Flujo de Decisión del Enrutador de Intenciones

```mermaid
stateDiagram-v2
    [*] --> CapturaAudio: Usuario habla / ingresa comando
    CapturaAudio --> TranscripcionSTT: Faster-Whisper procesa audio
    TranscripcionSTT --> ClasificacionTier: LLM Router evalúa contexto
    
    state ClasificacionTier {
        [*] --> Evaluacion
        Evaluacion --> EsComandoDirecto: Coincide con Skill registrada
        Evaluacion --> EsConsultaInformacion: Requiere dato ya generado
        Evaluacion --> EsTareaCompleja: Requiere razonamiento/escritura
    }

    EsComandoDirecto --> EjecutarSkill: Tier 1
    EjecutarSkill --> SintetizarVoz
    
    EsConsultaInformacion --> LeerReporteVault: Tier 2
    LeerReporteVault --> SintetizarVoz
    
    EsTareaCompleja --> LanzarAgenteHeadless: Tier 3
    LanzarAgenteHeadless --> NotificarInicioVoz
    NotificarInicioVoz --> EsperarTerminacionAgente
    EsperarTerminacionAgente --> NotificarFinVoz
    
    SintetizarVoz --> ReproducirAudio: Kokoro TTS
    ReproducirAudio --> [*]
    NotificarFinVoz --> [*]
```

### 4.2. Ingesta y Navegación Jerárquica del Vault (Patrón Karpathy)

```mermaid
stateDiagram-v2
    [*] --> IngestaDato: Recopilación de información cruda
    IngestaDato --> GuardarRAW: Almacenar en RAW/[fecha]-[fuente].md
    GuardarRAW --> SintesisConocimiento: Agente/Skill extrae conceptos clave
    SintesisConocimiento --> GuardarWIKI: Escribir artículo en WIKI/[tema]/
    GuardarWIKI --> ActualizarIndiceTematico: Insertar entrada en WIKI/[tema]/index.md
    ActualizarIndiceTematico --> ActualizarIndiceMaestro: Insertar referencia en WIKI/index.md
    ActualizarIndiceMaestro --> [*]: Vault sincronizado y listo para navegación
```
