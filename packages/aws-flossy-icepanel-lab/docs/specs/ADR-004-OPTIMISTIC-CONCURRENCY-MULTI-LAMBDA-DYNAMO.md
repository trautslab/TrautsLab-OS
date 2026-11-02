# ADR-004: Control de Concurrencia Optimista (OCC) y Prevención de "Lost Update" en Tablas Compartidas de DynamoDB

* **Estado:** ACEPTADO
* **Fecha:** 2026-11-02
* **Decisores:** Principal Database Architect, Core Banking Lead, Head of Financial Compliance
* **Contexto Técnico:** Topología Multi-Lambda compartiendo `core-accounts-master-local` en Floci / AWS DynamoDB

---

## 1. Contexto y Planteamiento del Problema

En un diseño de arquitectura serverless orientada a dominios (BIAN v10), es una práctica común que múltiples funciones Lambda operen sobre una tabla DynamoDB compartida (`core-accounts-master-local` o Single-Table Design):
* `lmb-reward-point-acc`: Actualiza el saldo de puntos de fidelidad (`pointsBalance`).
* `lmb-card-cashback-disb`: Actualiza el acumulado de cashback (`cashbackEarned`) y timestamp de auditoría.
* `lmb-sale-cust-cpgn`: Actualiza el estado de campañas del cliente (`activeCampaigns`).

### La Patología del "Lost Update" (Sobreescritura Destructiva)
Cuando dos agentes o flujos disparan mutaciones casi simultáneas:
1. **Instante T0:** Ambos procesos leen el registro del cliente: Saldo = 5,000 pts, Cashback = $100, Versión = 1.
2. **Instante T1:** Lambda A suma 500 puntos (espera guardar 5,500 pts).
3. **Instante T2:** Lambda B abona $25 de cashback (espera guardar $125).
4. **Instante T3 (Escritura Ciega sin OCC):** 
   - Si Lambda A escribe `PutItem` con su snapshot, guarda 5,500 pts.
   - Si Lambda B escribe 10ms después con su snapshot desactualizado, sobreescribe el ítem completo, dejando el saldo nuevamente en 5,000 pts.
   - **Consecuencia Financiera:** Se perdieron 500 puntos de forma silenciosa e irrecuperable.

---

## 2. Decisión de Arquitectura

Se prohibe terminantemente el uso de sobreescrituras ciegas (`PutItem` completo o `UpdateItem` sin condiciones) en registros compartidos.

### 2.1. Invariante OCC con Monotonic Versioning
Todo ítem en tablas con múltiples mutadores concurrentes DEBE mantener un atributo entero `version`.
Toda mutación debe ejecutarse mediante:
```typescript
const updateCommand = new UpdateItemCommand({
  TableName: "core-accounts-master-local",
  Key: { accountId: { S: accountId } },
  UpdateExpression: "SET cashbackEarned = :cashback, version = :nextVer, lastAccrualTimestamp = :now",
  ConditionExpression: "attribute_exists(accountId) AND version = :currentVer",
  ExpressionAttributeValues: {
    ":cashback": { N: String(newCashback) },
    ":nextVer": { N: String(currentVersion + 1) },
    ":currentVer": { N: String(currentVersion) },
    ":now": { S: new Date().toISOString() }
  }
});
```

### 2.2. Protocolo de Auto-Healing (Re-read with Exponential Backoff + Jitter)
Cuando DynamoDB arroja un error `ConditionalCheckFailedException (HTTP 409)`:
1. La Lambda intercepta el error de colisión.
2. Espera un retardo con Jitter aleatorio: `delay = Math.min(maxBackoff, baseDelay * 2^attempt) + random(0, 50ms)`.
3. Vuelve a leer el ítem fresco de DynamoDB con lectura fuertemente consistente (`ConsistentRead: true`).
4. Re-calcula la mutación sobre el nuevo estado y reintenta la escritura (hasta 3 intentos).
5. Si los 3 intentos fallan por ultra-alta contención, encola la transacción en la cola SQS de absorción (`payment-cce-ingress-queue-local`).

---

## 3. Consecuencias

### Positivas:
- **Cero Pérdida de Datos Financieros:** Matemáticamente imposible perder un abono por sobreescritura concurrente.
- **Transparencia en Telemetría:** Cada colisión interceptada emite una métrica `OCC_COLLISION_RESOLVED` a CloudWatch para auditar el nivel de contención del sistema.

### Compensaciones:
- Añade una latencia media de 15ms a 35ms en el segundo intento concurrente.

