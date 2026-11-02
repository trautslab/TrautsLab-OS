# ADR-003: Circuit Breaker Semántico y Auto-Recuperación ante Servicios Inexistentes ([NO EXISTE] y [POR CREAR])

* **Estado:** ACEPTADO
* **Fecha:** 2026-11-02
* **Decisores:** Principal Cloud Architect, Squad Tech Lead, Site Reliability Engineer
* **Contexto Técnico:** Topología Agentica (ACG -> ACR MCP -> Lambdas Serverless -> Floci)

---

## 1. Contexto y Planteamiento del Problema

En un ecosistema corporativo bancario con más de 80 repositorios y múltiples squads, el catálogo de herramientas contiene inevitablemente dependencias en tres estados dispares:
1. **Activas:** Microservicios y Lambdas en producción.
2. **Por Crear (`[POR CREAR]`):** Herramientas aprobadas en arquitectura pero en fase de implementación por otro squad (ej. `acr-io-sale-campaign-mcp-01`).
3. **Inexistentes / Phantoms (`[NO EXISTE]`):** Dependencias heredadas o proyecciones descontinuadas (ej. `lmb-(env)-io-made-campaign-dsg-pjc_findby-id-01`).

Si un agente LLM intenta llamar a un microservicio phantom, el gateway por defecto experimenta:
* Timeout de conexión (30s de congelamiento).
* Error opaco `502 Bad Gateway` / `504 Gateway Timeout`.
* Alucinación del LLM asegurándole al usuario que su transacción falló por falta de fondos o fraude.

---

## 2. Decisión de Arquitectura

Se aprueba la incorporación de:

### 2.1. Circuit Breaker Semántico en Agent Core Gateway (ACG)
* El ACG implementa una máquina de estados de Circuit Breaker (`CLOSED`, `OPEN`, `HALF_OPEN`) sobre cada target backend.
* Si un servicio está registrado como `[NO EXISTE]` o acumula fallos de conectividad, el circuito pasa inmediatamente a `OPEN`.
* El ACG intercepta la llamada en 2ms y devuelve un envelope degradado:
  ```json
  {
    "statusCode": 503,
    "error": {
      "code": "CIRCUIT_BREAKER_OPEN_PHANTOM_SERVICE",
      "message": "El servicio 'lmb-made-campaign-pjc' no existe o está en construcción.",
      "suggestedAlternative": "campaigns_find_eligible",
      "canRetry": false
    }
  }
  ```

### 2.2. Validación Estricta de Contrato y Schema Hints (Anti-Drift)
* Todo payload inbound es validado contra regex y tipado exacto.
* Si el LLM envía un tipo inválido (ej. un entero en lugar de un código regex), el MCP devuelve un error 400 semántico indicando exactamente qué campo falló y cuál es el formato esperado para auto-corrección inmediata.

