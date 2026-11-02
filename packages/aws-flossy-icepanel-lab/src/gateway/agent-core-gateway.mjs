/**
 * src/gateway/agent-core-gateway.mjs
 * Agent Core Gateway (ACG) - Semantic Ingress & Router
 * 
 * Ingests user/LLM intents, resolves the appropriate Agent Core Runtime (ACR) MCP tool,
 * and tracks end-to-end latency, contracts, and telemetry.
 */

import { AgentCoreRuntimeMCP } from "./agent-core-runtime-mcp.mjs";

export class AgentCoreGateway {
  constructor() {
    this.runtime = new AgentCoreRuntimeMCP();
    this.circuitBreakers = new Map(); // target -> { state: "CLOSED" | "OPEN", failures: number }
  }

  getCircuitState(target) {
    if (!this.circuitBreakers.has(target)) {
      this.circuitBreakers.set(target, { state: "CLOSED", failures: 0 });
    }
    return this.circuitBreakers.get(target);
  }

  recordFailure(target) {
    const cb = this.getCircuitState(target);
    cb.failures += 1;
    if (cb.failures >= 1) {
      cb.state = "OPEN";
      console.log(`\x1b[31m[ACG-CircuitBreaker]\x1b[0m ⚠️ Circuit TRIPPED to OPEN for target '\x1b[1m${target}\x1b[0m' (Failures: ${cb.failures})`);
    }
  }

  async handleInboundIntent(intent, parameters) {
    console.log(`\x1b[35m[ACG-Gateway]\x1b[0m Inbound Intent: \x1b[1m'${intent}'\x1b[0m with params:`, JSON.stringify(parameters));

    // Semantic Intent Mapping Table
    const intentMap = {
      "FIND_COUPON": "coupons_find_by_id",
      "LIST_ACTIVE_COUPONS": "coupons_find_non_expired",
      "CHECK_POINTS_BALANCE": "rewards_get_balance",
      "ADD_LOYALTY_POINTS": "rewards_accrue_points",
      "GET_CUSTOMER_CAMPAIGNS": "campaigns_find_eligible",
      "GET_CAMPAIGN_DESIGN": "campaign_design_projection", // Points to [NO EXISTE]
      "PLAN_SALE_CAMPAIGN": "sale_campaign_planner"        // Points to [POR CREAR]
    };

    const targetTool = intentMap[intent];
    if (!targetTool) {
      return {
        status: "ERROR",
        httpStatus: 404,
        error: `Unknown semantic intent: ${intent}. Valid intents: ${Object.keys(intentMap).join(", ")}`
      };
    }

    const cb = this.getCircuitState(targetTool);
    if (cb.state === "OPEN") {
      console.log(`\x1b[31m[ACG-Gateway]\x1b[0m Fast-Failing request because Circuit Breaker is OPEN for '\x1b[1m${targetTool}\x1b[0m'`);
      return {
        status: "CIRCUIT_BREAKER_ACTIVE",
        httpStatus: 503,
        circuitState: "OPEN",
        routedVia: "acg-semantic-router-01 -> CircuitBreaker (Degraded Fallback)",
        roundtripMs: 1,
        payload: {
          statusCode: 503,
          error: {
            code: "CIRCUIT_BREAKER_OPEN",
            message: `Target capability '${targetTool}' is currently unavailable. Circuit is OPEN.`,
            suggestedFallback: "Use 'GET_CUSTOMER_CAMPAIGNS' as alternative."
          }
        }
      };
    }

    console.log(`\x1b[35m[ACG-Gateway]\x1b[0m Routing to MCP Tool: \x1b[36m${targetTool}\x1b[0m`);
    const result = await this.runtime.invokeTool(targetTool, parameters);

    if (result.statusCode >= 500) {
      this.recordFailure(targetTool);
    }

    return {
      status: result.statusCode === 200 ? "SUCCESS" : (result.statusCode === 400 ? "CLIENT_ERROR" : "FAILED"),
      httpStatus: result.statusCode,
      routedVia: "acg-semantic-router-01 -> acr_io_enterprise_banking_mcp",
      roundtripMs: result.roundtripMs,
      payload: result.result
    };
  }
}

