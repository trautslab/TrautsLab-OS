#!/usr/bin/env node
/**
 * bin/test-acg-collision-sim.mjs
 * Simulates concurrent external LLM traffic against the Agent Core Gateway (ACG)
 * and demonstrates collision scenarios (Ambiguity, Concurrency Burst, Race Condition, Context Bloat).
 */

const SLEEP = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class MockAgentCoreGateway {
  constructor(mode = 'unprotected') {
    this.mode = mode; // 'unprotected' | 'hardened'
    this.activeLocks = new Set();
    this.concurrencyCount = 0;
    this.maxConcurrency = 5;
    this.tokenBucket = 10;
  }

  async handleQuery(agentId, prompt, payload) {
    console.log(`\n📨 [ACG Ingress] Agent '${agentId}' -> Query: "${prompt}"`);

    // 1. Concurrency Burst Check
    this.concurrencyCount++;
    if (this.concurrencyCount > this.maxConcurrency) {
      if (this.mode === 'unprotected') {
        this.concurrencyCount--;
        return {
          status: 429,
          error: 'COLLISION: AWS Lambda Concurrency Starvation (HTTP 429 Too Many Requests)',
          latencyMs: 12
        };
      } else {
        console.log(`   🛡️ [ACG Queue] Queuing burst request to prevent Lambda starvation...`);
        await SLEEP(50);
      }
    }

    // 2. Semantic Routing Ambiguity Check
    const lower = prompt.toLowerCase();
    const isAmbiguous = lower.includes('cupon') && lower.includes('campaña');
    if (isAmbiguous && this.mode === 'unprotected') {
      this.concurrencyCount--;
      return {
        status: 409,
        error: 'COLLISION: Semantic Tool Overlap Ambiguity (Conflict between acr_vads_coupons and acr_sale_campaign)',
        latencyMs: 35
      };
    }

    // 3. Race Condition / Distributed Lock Check
    if (payload && payload.customerId && payload.action === 'reserve') {
      const lockKey = `lock:customer:${payload.customerId}`;
      if (this.activeLocks.has(lockKey)) {
        if (this.mode === 'unprotected') {
          console.log(`   💥 [Race Condition] Concurrent mutation on customer '${payload.customerId}' without lock!`);
          this.concurrencyCount--;
          return {
            status: 500,
            error: 'COLLISION: Double Action Race Condition (State corrupted: Stale read-after-write)',
            latencyMs: 80
          };
        } else {
          console.log(`   🛡️ [ACG Lock] Customer locked by in-flight transaction. Returning 409 Retry-After...`);
          this.concurrencyCount--;
          return {
            status: 409,
            message: 'Idempotency Lock Active. Retrying with exponential backoff...',
            latencyMs: 15
          };
        }
      }
      this.activeLocks.add(lockKey);
      await SLEEP(60); // Simulate backend work in lmb
      this.activeLocks.delete(lockKey);
    }

    // 4. Context Bloat Check
    if (lower.includes('all') || lower.includes('todos')) {
      if (this.mode === 'unprotected') {
        this.concurrencyCount--;
        return {
          status: 200,
          warning: 'COLLISION: Context Window Bloat (Returned 850 unpaginated items, 3.2MB payload -> LLM Token Limit Exceeded)',
          itemCount: 850,
          latencyMs: 280
        };
      } else {
        this.concurrencyCount--;
        return {
          status: 200,
          message: 'SUCCESS: Paginated into top 10 items with next_token',
          itemCount: 10,
          latencyMs: 45
        };
      }
    }

    // 5. Uncreated Tool Check (por crear)
    if (lower.includes('sale-campaign') || lower.includes('opse-reward')) {
      this.concurrencyCount--;
      return {
        status: 501,
        error: 'COLLISION: Unimplemented Tool Invoked (acr-io-sale-campaign-mcp-01 is [POR CREAR] -> HTTP 501 Not Implemented)',
        latencyMs: 18
      };
    }

    // 6. Phantom / Non-existent Dependency Check (no existe)
    if (lower.includes('made-campaign') || lower.includes('dsg-pjc')) {
      this.concurrencyCount--;
      return {
        status: 502,
        error: 'COLLISION: Ghost Dependency Broken Connection (lmb-*-made-campaign-dsg-pjc [NO EXISTE] -> HTTP 502 Bad Gateway)',
        latencyMs: 45
      };
    }

    this.concurrencyCount--;
    return {
      status: 200,
      message: 'SUCCESS: Tool executed through ACR -> Lambda successfully',
      targetRuntime: 'acr_{env}_io_vads_coupons_mcp_01',
      backendService: 'lmb-matrix-findby-id-coupons-qry-svc-01',
      latencyMs: 40
    };
  }
}

async function runDemo() {
  console.log('==================================================================');
  console.log('💥 DEMO DE COLISIONES: AGENT CORE GATEWAY (ACG) <- LLMs EXTERNOS');
  console.log('==================================================================');

  // --- ESCENARIO 1: MODO DESPROTEGIDO (Demostración de las 4 colisiones) ---
  console.log('\n🔴 [FASE 1] Ejecutando ráfagas en ACG SIN SALVAGUARDAS (Modo Frágil)...');
  const fragileGateway = new MockAgentCoreGateway('unprotected');

  const queriesUnprotected = [
    { agent: 'Copilot-Mobile', query: 'Dame los cupones activos de la campaña de hoy', payload: {} },
    { agent: 'Batch-Loyalty-Agent', query: 'Listar todos los cupones del sistema sin filtro', payload: {} },
    { agent: 'Checkout-Agent-A', query: 'Aplicar y reservar cupón 99', payload: { customerId: 'CUST-1001', action: 'reserve' } },
    { agent: 'Checkout-Agent-B', query: 'Aplicar y reservar cupón 99 simultáneo', payload: { customerId: 'CUST-1001', action: 'reserve' } },
    { agent: 'Marketing-Copilot', query: 'Consultar herramientas de sale-campaign mcp', payload: {} },
    { agent: 'Design-Agent', query: 'Ejecutar proyección de made-campaign dsg-pjc', payload: {} },
    { agent: 'Analytics-Agent-1', query: 'Buscar cupon por id 55', payload: {} },
    { agent: 'Analytics-Agent-2', query: 'Buscar cupon por id 56', payload: {} }
  ];

  const results1 = await Promise.all(
    queriesUnprotected.map((q) => fragileGateway.handleQuery(q.agent, q.query, q.payload))
  );

  console.log('\n📊 Resumen de Colisiones Detectadas en Fase 1:');
  let collisionsCount = 0;
  for (let i = 0; i < results1.length; i++) {
    const res = results1[i];
    if (res.error || res.warning) {
      collisionsCount++;
      console.log(`  ❌ [Req ${i + 1}] ${res.error || res.warning} (${res.latencyMs}ms)`);
    } else {
      console.log(`  ✅ [Req ${i + 1}] ${res.message} (${res.latencyMs}ms)`);
    }
  }

  console.log(`\n⚠️ Total de llamadas con colisión o advertencia: ${collisionsCount} de ${results1.length}`);

  // --- ESCENARIO 2: MODO HARDENED (Salvaguardas Activas) ---
  console.log('\n------------------------------------------------------------------');
  console.log('🟢 [FASE 2] Ejecutando ráfagas en ACG CON DEFENSAS (Modo Blindado)...');
  const hardenedGateway = new MockAgentCoreGateway('hardened');

  const queriesHardened = [
    { agent: 'Copilot-Mobile', query: 'vads.coupons.findby_id: cupón 99', payload: {} },
    { agent: 'Batch-Loyalty-Agent', query: 'Listar cupones paginados', payload: {} },
    { agent: 'Checkout-Agent-A', query: 'Reservar cupón 99', payload: { customerId: 'CUST-1001', action: 'reserve' } },
    { agent: 'Checkout-Agent-B', query: 'Reservar cupón 99 con lock activo', payload: { customerId: 'CUST-1001', action: 'reserve' } }
  ];

  const results2 = await Promise.all(
    queriesHardened.map((q) => hardenedGateway.handleQuery(q.agent, q.query, q.payload))
  );

  console.log('\n📊 Resumen de Resultados en Fase 2 (Protegido):');
  for (let i = 0; i < results2.length; i++) {
    const res = results2[i];
    console.log(`  🛡️ [Req ${i + 1}] Status ${res.status}: ${res.message || res.error} (${res.latencyMs}ms)`);
  }

  console.log('\n==================================================================');
  console.log('✅ DEMO COMPLETADA: Mecanismos de colisión y mitigación demostrados!');
  console.log('==================================================================\n');
}

runDemo();

