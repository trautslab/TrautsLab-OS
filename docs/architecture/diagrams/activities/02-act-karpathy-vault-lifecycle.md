# Diagrama de Actividades: Ciclo de Vida de Ingesta y Navegación del Vault (Patrón Karpathy)

> **ID:** `ACT-02` | **Categoría:** Diagramas de Actividades y Estados  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)  
> **Estándar Horario:** `PET / UTC-5 - Hora Perú`

---

## ⚙️ Diagrama del Ciclo de Vida de Conocimiento

```mermaid
stateDiagram-v2
    [*] --> IngestaDato: Recopilación de información cruda (Scraper / Voz)
    IngestaDato --> GuardarRAW: Almacenar en RAW/[fecha]-[fuente].json
    GuardarRAW --> SintesisConocimiento: Agente/Skill extrae conceptos clave
    SintesisConocimiento --> GuardarWIKI: Escribir artículo en WIKI/[dominio]/
    GuardarWIKI --> ActualizarIndiceTematico: Insertar entrada en WIKI/[dominio]/index.md
    ActualizarIndiceTematico --> ActualizarIndiceMaestro: Insertar referencia en WIKI/index.md
    ActualizarIndiceMaestro --> ActualizarCacheTier2: Snapshot snapshot JSON en OUTPUT/cache/
    ActualizarCacheTier2 --> [*]: Vault sincronizado y listo para agentes y voz
```

---
[⬅️ Volver al Índice de Diagramas](../index.md)
