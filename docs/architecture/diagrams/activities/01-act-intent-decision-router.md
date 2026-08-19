# Diagrama de Actividades: Flujo de Decisión del Enrutador Semántico LLM

> **ID:** `ACT-01` | **Categoría:** Diagramas de Actividades y Estados  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)  
> **Estándar Horario:** `PET / UTC-5 - Hora Perú`

---

## ⚙️ Diagrama de Estados y Decisión

```mermaid
stateDiagram-v2
    [*] --> CapturaAudio: Usuario habla / ingresa comando
    CapturaAudio --> TranscripcionSTT: Whisper Large v3 Turbo (GPU Metal)
    TranscripcionSTT --> ClasificacionTier: LLM Intent Router (qwen2.5:3b)
    
    state ClasificacionTier {
        [*] --> EvaluacionSemantica
        EvaluacionSemantica --> EsComandoDirecto: Coincide con Skill (Tier 1)
        EvaluacionSemantica --> EsConsultaInformacion: Dato en snapshot JSON (Tier 2)
        EvaluacionSemantica --> EsTareaCompleja: Razonamiento / Creación (Tier 3)
    }

    EsComandoDirecto --> EjecutarSkill: SkillRegistry.execute()
    EjecutarSkill --> EmitirSSE: broadcastLiveEvent()
    EmitirSSE --> SintetizarVoz
    
    EsConsultaInformacion --> LeerReporteVault: Tier2CacheManager (<20ms)
    LeerReporteVault --> SintetizarVoz
    
    EsTareaCompleja --> LanzarAgenteHeadless: Subproceso asíncrono
    LanzarAgenteHeadless --> NotificarInicioVoz
    NotificarInicioVoz --> EsperarTerminacionAgente
    EsperarTerminacionAgente --> NotificarFinVoz
    
    SintetizarVoz --> ReproducirAudio: Kokoro TTS (<250ms)
    ReproducirAudio --> [*]
    NotificarFinVoz --> [*]
```

---
[⬅️ Volver al Índice de Diagramas](../index.md)
