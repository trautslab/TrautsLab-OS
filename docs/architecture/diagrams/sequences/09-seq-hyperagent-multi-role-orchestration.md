# Diagrama de Secuencia: Orquestación Multi-Rol HyperAgent (Tier 3)

> **ID:** `SEQ-09` | **Categoría:** Diagramas de Secuencia  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)  
> **Estándar Horario:** `PET / UTC-5 - Hora Perú`

---

## 🔄 Flujo de Ejecución

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Jhonny (Voz / MCP / Web)
    participant Router as LLM Intent Router
    participant Orchestrator as HyperOrchestrator
    participant Planner as HyperPlanner
    participant Navigator as HyperNavigator
    participant Editor as HyperEditor
    participant Executor as HyperExecutor
    participant Vault as Obsidian Vault
    participant SSE as Stream SSE (/api/events/live)
    participant Notifier as Telegram / Kokoro TTS

    Usuario->>Router: "Investiga arquitecturas de voz local y escribe reporte en WIKI"
    Note over Router: Clasifica -> TIER_3_AGENT (HyperAgent)
    Router->>Orchestrator: startTask(goal, context)
    Router-->>Usuario: "Iniciando investigación en segundo plano con la cuadrilla HyperAgent."

    Orchestrator->>Planner: decomposeGoal(goal)
    Planner-->>Orchestrator: HyperPlan [Task 1: Search, Task 2: Write, Task 3: Index]
    Orchestrator->>SSE: broadcastEvent('HYPERAGENT_PLAN_CREATED', plan)

    Note over Orchestrator,Navigator: Paso 1: Exploración
    Orchestrator->>Navigator: locateContext("modelos de voz local")
    Navigator->>Vault: HybridSearchEngine.search("voz local")
    Vault-->>Navigator: [Resultados relevantes en Vault]
    Navigator-->>Orchestrator: ContextSummary

    Note over Orchestrator,Editor: Paso 2: Redacción Quirúrgica
    Orchestrator->>Editor: generateArticle(topic, context)
    Editor->>Vault: Escribe WIKI/ai-systems/local-voice-architectures.md
    Editor-->>Orchestrator: FileCreated

    Note over Orchestrator,Executor: Paso 3: Verificación & Auto-Reparación
    Orchestrator->>Executor: verifyAndReindex(filePath)
    Executor->>Vault: Ejecuta vault-sync-indexer
    Vault-->>Executor: "✓ 5 tablas de contenidos actualizadas"
    Executor-->>Orchestrator: ExecutionSuccess

    Orchestrator->>SSE: broadcastEvent('HYPERAGENT_TASK_FINISHED', result)
    Orchestrator->>Notifier: Envía mensaje a @TrautsLabBot & sintetiza voz
    Notifier-->>Usuario: "✓ He completado la investigación. El reporte ya está en tu Vault."
```

---
[⬅️ Volver al Índice de Diagramas](../index.md)
