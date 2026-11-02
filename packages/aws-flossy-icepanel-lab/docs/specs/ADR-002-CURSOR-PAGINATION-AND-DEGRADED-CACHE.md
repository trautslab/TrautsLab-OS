# ADR-002: Paginación Cursor-Based y Prevención de Context Window Bloat en Consultas Agénticas

* **Estado:** ACEPTADO
* **Fecha:** 2026-11-02
* **Decisores:** Lead Enterprise Architect, Head of AI Platform, Senior Security Engineer
* **Contexto Técnico:** Topología Agentica (ACG -> ACR MCP -> Lambdas Serverless -> Floci)

---

## 1. Contexto y Planteamiento del Problema

Cuando un modelo LLM invoca herramientas MCP para consultar catálogos (ej. cupones activos, extractos de cuenta, transacciones históricas), un endpoint que devuelva cientos de registros en una sola respuesta genera los siguientes impactos críticos:

1. **Context Window Bloat:** Un volcado JSON de 200 cupones consume entre 15k y 40k tokens, consumiendo la ventana de contexto del modelo.
2. **Degradación de Razonamiento:** Al recibir payloads masivos sin estructurar, el LLM pierde capacidad de atención (*Lost in the Middle*) y alucina detalles de ofertas no vigentes.
3. **Costos y Latencia:** La latencia de inferencia y costo por token se disparan linealmente.

---

## 2. Decisión de Arquitectura

Se aprueba la implementación obligatoria de:

### 2.1. Paginación Basada en Cursores Opacos (Cursor-Based Pagination)
* Las Lambdas de consulta (`lmb-matrix-findby-non-expired-coupons-qry-svc-01`) NUNCA devuelven más de `limit` elementos (default: 3, máx: 20).
* Toda respuesta incluye un bloque estándar `pageInfo`:
  ```json
  {
    "totalMatched": 8,
    "returnedCount": 3,
    "limit": 3,
    "hasMore": true,
    "nextCursorToken": "eyJvZmZzZXQiOjMsImNhdGVnb3J5IjoiQUxMIn0="
  }
  ```
* El `nextCursorToken` es un token base64 opaco que encapsula el desplazamiento y estado temporal, sin exponer detalles internos de la base de datos.

### 2.2. Enriquecimiento y Filtrado Temprano en Runtime MCP
* El LLM puede solicitar filtrado semántico previo por categoría (`category: "TRAVEL"`, `"RETAIL"`, etc.) reduciendo el conjunto de trabajo antes de transferir datos por red.

---

## 3. Consecuencias

### Positivas:
- **Consumo Predecible de Tokens:** El tamaño de carga por turno de conversación permanece acotado a menos de 500 tokens.
- **Interactividad Humana:** El agente puede decir: *"He encontrado 8 cupones disponibles. Te muestro los primeros 3; ¿deseas ver los siguientes o filtrar por Viajes?"*.

