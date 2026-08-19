# Diagrama de Secuencia: Automatización Matutina (*Daily Intel Cron*)

> **ID:** `SEQ-02` | **Categoría:** Diagramas de Secuencia  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)  
> **Estándar Horario:** `PET / UTC-5 - Hora Perú`

---

## 🔄 Flujo de Ejecución

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Cron Scheduler (08:00 AM)
    participant Skill as Skill morning-intel-scan
    participant External as GitHub / HackerNews APIs
    participant RAW as Vault/RAW/
    participant WIKI as Vault/WIKI/
    participant Indexer as Vault Indexer

    Cron->>Skill: Dispara ejecución programada
    Skill->>External: Consulta tendencias (7d GitHub + Top HN)
    External-->>Skill: JSONs de datos crudos
    Skill->>RAW: Almacena RAW/YYYY-MM-DD-intel-data.json
    Skill->>WIKI: Sintetiza y crea WIKI/YYYY-MM-DD-morning-intel.md
    Skill->>Indexer: Solicita actualización de índices
    Indexer->>WIKI: Regenera WIKI/index.md con nuevos enlaces
    Skill-->>Cron: Reporta ejecución completada (Caché Tier 2 lista)
```

---
[⬅️ Volver al Índice de Diagramas](../index.md)
