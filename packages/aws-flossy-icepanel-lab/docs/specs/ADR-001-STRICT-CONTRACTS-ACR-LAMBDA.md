# ADR-001: Contratos Estrictos en Agent Core Runtime y Prevención de Colisiones en Tablas Compartidas DynamoDB

* **Estado:** ACEPTADO
* **Fecha:** 2026-11-02
* **Decisores:** Principal Solutions Architect, Core Banking Squad Lead, Enterprise Security Officer
* **Contexto Técnico:** Topología Agentica (ACG -> ACR MCP -> Lambdas Serverless -> Amazon DynamoDB en Floci)

---

## 1. Contexto y Planteamiento del Problema

En la modernización agéntica de la arquitectura Core Banking (BIAN v10), múltiples agentes de inteligencia artificial y copilotos interactúan a través de un **Agent Core Gateway (ACG)** con un clúster de herramientas **Agent Core Runtime (ACR - MCP)**.

A su vez, este runtime delega la ejecución de consultas y mutaciones transaccionales a un parque de **Lambdas de dominio (`lmb-...`)**.

### Puntos de Dolor Identificados:
1. **Deriva de Contratos (Contract Drift):** Cuando una Lambda de backend altera sutilmente su respuesta (ej. renombrando `id` a `couponId` o cambiando un número a string), el servidor MCP falla de forma silente o el LLM alucina parámetros, degradando la experiencia bancaria.
2. **Colisión en Tablas Compartidas de DynamoDB (The "Shared Table Dilemma"):** Múltiples Lambdas de distintos squads (Campañas, Cupones, Puntos de Fidelidad, Saldos) leen y escriben sobre la misma entidad en DynamoDB (`core-accounts-master-local`). Sin un control de concurrencia formal, dos actualizaciones simultáneas provocan el fenómeno de **Lost Update** (sobreescritura destructiva de saldo o estado).
3. **Dependencias Phantom (Servicios por crear o inexistentes):** La topología incluye repositorios planificados (`por crear`) e inexistentes (`no existe`). Una invocación no protegida propaga errores `502 Bad Gateway` en cascada.

---

## 2. Decisión de Arquitectura

Se aprueba la adopción de las siguientes 4 directrices técnicas de cumplimiento obligatorio:

### 2.1. Contrato-Primero con JSON Schema Tipado en ACR
Todo MCP Tool DEBE tener un esquema formal JSON Schema (Draft 2020-12) sincronizado bidireccionalmente con el contrato de la Lambda de backend.
* El ACR valida estrictamente los argumentos recibidos (`additionalProperties: false`) antes de disparar la invocación AWS Lambda.
* Toda respuesta de Lambda debe ser encapsulada en un `ResponseEnvelope` canónico con `statusCode`, `data`, y `metadata.version`.

### 2.2. Optimistic Concurrency Control (OCC) Obligatorio en DynamoDB
Queda terminantemente prohibido ejecutar `PutItem` o `UpdateItem` a ciegas sobre entidades compartidas en DynamoDB.
* Todo ítem de entidad compartida DEBE poseer un atributo entero monotónico `version` (iniciando en 1).
* Toda mutación DEBE incluir la cláusula de guardia:
  ```sql
  ConditionExpression: "attribute_exists(accountId) AND version = :expectedVersion"
  UpdateExpression: "ADD version :one, pointsBalance :inc SET lastAccrualTimestamp = :now"
  ```
* En caso de recibir `ConditionalCheckFailedException (HTTP 409)`, la Lambda o el ACR deben aplicar el patrón **Read-Replay con Jitter exponencial** (hasta 3 reintentos antes de devolver error).

### 2.3. Circuit Breaker Semántico en Agent Core Gateway
Para componentes catalogados como `[POR CREAR]` o `[NO EXISTE]`:
* El Gateway ACG debe mantener una tabla de capacidades de salud (*Service Mesh Health Registry*).
* Si una herramienta apunta a un microservicio inexistente, el Gateway responde con un estado semántico estructurado `CAPABILITY_UNDER_CONSTRUCTION` en lugar de un error 502 no controlado, permitiendo al LLM ofrecer caminos alternativos al cliente.

---

## 3. Consecuencias

### Positivas:
- **Cero Pérdida de Datos Financieros:** Las transacciones concurrentes sobre cuentas y puntos quedan blindadas contra sobreescrituras destructivas.
- **Auto-Corrección en LLMs:** Las respuestas tipadas y mensajes de error estructurados con códigos semánticos permiten que los LLMs reformulen sus peticiones sin intervención humana.
- **Validación Local Determinista:** Todas las pruebas de contrato y colisión se ejecutan localmente en Floci (`localhost:4566`) a costo cero y con latencias inferiores a 50ms.

### Compensaciones (Trade-offs):
- Los squads deben mantener sincronizados los esquemas JSON de contratos en el repositorio central.
- Las mutaciones con alta contención pueden experimentar reintentos de red por OCC; para flujos de ultra-alta frecuencia (ej. pagos con tarjeta masivos), se requerirá la cola SQS de absorción ya aprovisionada.

