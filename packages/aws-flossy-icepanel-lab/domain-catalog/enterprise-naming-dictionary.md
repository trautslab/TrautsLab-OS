# 📖 Diccionario Canónico de Nomenclatura Empresarial (Cloud Core Banking & Agentic Native)

Este diccionario formaliza la taxonomía estandarizada para todos los repositorios, microservicios, agentes e infraestructura del ecosistema. Sigue la gramática:

$$\text{\texttt{[Runtime]}}\ \boldsymbol{-}\ \text{\texttt{[Entorno]}}\ \boldsymbol{-}\ \text{\texttt{[Scope]}}\ \boldsymbol{-}\ \text{\texttt{[Dominio/Subdominio]}}\ \boldsymbol{-}\ \text{\texttt{[Arquetipo/Operacion]}}\ \boldsymbol{-}\ \text{\texttt{[Correlativo]}}$$

---

## 🏗️ 1. Prefijos de Runtime e Infraestructura Cómputo (`[Runtime]`)

### Capa Agéntica e Inteligencia Artificial (Agentic Layer)
| Prefijo | Definición | Propósito y Responsabilidad |
| :---: | :--- | :--- |
| **`acg`** | **Agent Core Gateway** | Puerta de enlace inteligente: Enrutador semántico, proxy MCP, autenticación, rate-limiting, observabilidad y balanceo de consultas desde LLMs externos. |
| **`acr`** | **Agent Core Runtime** | Host contenedor del Agente IA y Servidor MCP. Expone esquemas de herramientas (*Tools*) y recursos hacia el gateway. |
| **`acm`** | **Agent Core Memory** | Almacén de contexto, embeddings vectoriales y memoria de sesión/episódica del agente. |

### Cómputo y Contenedores (Compute)
| Prefijo | Servicio AWS | Uso Principal |
| :---: | :--- | :--- |
| **`lmb`** | AWS Lambda | Funciones serverless granulares (Comandos CQRS, Queries findby, Proyecciones). |
| **`eks`** | Amazon EKS | Microservicios transaccionales de alta concurrencia desplegados en Kubernetes. |
| **`ecs`** | Amazon ECS Fargate | Contenedores serverless para procesos continuos, adaptadores SNA/Host y bridges batch. |
| **`app`** | AWS App Runner | Microservicios HTTP serverless totalmente administrados. |

---

## ⚡ 2. Prefijos de Eventos, Colas y Orquestación

| Prefijo | Servicio AWS | Rol Arquitectónico |
| :---: | :--- | :--- |
| **`evb`** | Amazon EventBridge | Enterprise Event Bus, reglas de filtrado de eventos de dominio y EventBridge Pipes. |
| **`sfn`** | AWS Step Functions | Orquestadores de Sagas distribuidas, flujos multi-paso y compensación transaccional. |
| **`sqs`** | Amazon SQS | Colas de mensajería asíncrona, desacoplamiento y Dead Letter Queues (DLQ). |
| **`sns`** | Amazon SNS | Tópicos de notificación Pub/Sub para fan-out masivo y alertas de incidentes. |
| **`apg`** | Amazon API Gateway | API Gateways REST, HTTP y WebSocket de entrada cliente/canal. |

---

## 💾 3. Prefijos de Persistencia y Almacenamiento

| Prefijo | Servicio AWS | Rol Arquitectónico |
| :---: | :--- | :--- |
| **`ddb`** | Amazon DynamoDB | Tablas NoSQL maestras, particionadas por clave hash, con Streams activados. |
| **`dax`** | DynamoDB DAX | Clúster en memoria para lecturas con microsegundos de latencia. |
| **`rds`** | Amazon RDS Aurora | Bases de datos relacionales PostgreSQL / MySQL para transacciones ACID. |
| **`s3b`** | Amazon S3 Bucket | Almacén de objetos, estados de cuenta, contratos con Object Lock (WORM). |
| **`elc`** | Amazon ElastiCache | Clúster Redis en memoria para control de sesiones, bloqueos distribuidos y caché. |
| **`oss`** | Amazon OpenSearch | Indexador de auditoría, búsqueda de texto completo y base de datos vectorial para RAG. |

---

## 🛡️ 4. Prefijos de Seguridad, Configuración y Observabilidad

| Prefijo | Servicio AWS | Rol Arquitectónico |
| :---: | :--- | :--- |
| **`kms`** | AWS KMS | Llaves de cifrado gestionadas por el cliente (CMK) para datos en reposo. |
| **`smx`** | AWS Secrets Manager | Bóveda de secretos, credenciales rotativas y tokens de terceros. |
| **`cwm`** | CloudWatch Metric Alarm | Alarmas de métricas para SLOs, DLQ depth y tasas de error 5xx. |
| **`cwl`** | CloudWatch Log Group | Grupos de logs centralizados con políticas de retención. |
| **`xry`** | AWS X-Ray | Trazas distribuidas de extremo a extremo (End-to-End Latency). |

---

## 🎯 5. Sufijos de Arquetipo y Patrones de Interacción (`[Arquetipo]`)

| Sufijo | Nombre del Arquetipo | Regla de Implementación |
| :---: | :--- | :--- |
| **`-mcp`** | **Model Context Protocol Server** | Exposición de herramientas JSON-RPC 2.0 para agentes LLM. |
| **`-qry`** | **Query (CQRS Read)** | Servicio de consulta de solo lectura, sin efectos colaterales. |
| **`-cmd`** | **Command (CQRS Write)** | Mutación transaccional con validación de invariantes y emisión outbox. |
| **`-pjc`** | **Projection (Read Model)** | Consumidor de eventos que materializa vistas de lectura. |
| **`-ex` / `-exec`** | **Execution Processor** | Ejecutor operativo de tareas de fondo o batch. |
| **`-findby-*`** | **Query Finder Operation** | Filtros canónicos de consulta (`findby-id`, `findby-non-expired`, `findby-cust`). |
| **`-dlq`** | **Dead Letter Queue** | Cola de mensajes fallidos con políticas de redrive. |
| **`-saga`** | **Distributed Saga** | Flujo orquestado con garantía de rollback/compensación. |

