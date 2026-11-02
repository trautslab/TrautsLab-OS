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
  }

  async handleInboundIntent(intent, parameters) {
    console.log(`\x1b[35m[ACG-Gateway]\x1b[0m Inbound Intent: \x1b[1m'${intent}'\x1b[0m with params:`, JSON.stringify(parameters));

    // Semantic Intent Mapping Table
    const intentMap = {
      "FIND_COUPON": "coupons_find_by_id",
      "CHECK_POINTS_BALANCE": "rewards_get_balance",
      "ADD_LOYALTY_POINTS": "rewards_accrue_points",
      "GET_CUSTOMER_CAMPAIGNS": "campaigns_find_eligible"
    };

    const targetTool = intentMap[intent];
    if (!targetTool) {
      return {
        status: "ERROR",
        httpStatus: 404,
        error: `Unknown semantic intent: ${intent}. Valid intents: ${Object.keys(intentMap).join(", ")}`
      };
    }

    console.log(`\x1b[35m[ACG-Gateway]\x1b[0m Routing to MCP Tool: \x1b[36m${targetTool}\x1b[0m`);
    const result = await this.runtime.invokeTool(targetTool, parameters);

    return {
      status: result.statusCode === 200 ? "SUCCESS" : "FAILED",
      httpStatus: result.statusCode,
      routedVia: "acg-semantic-router-01 -> acr_io_enterprise_banking_mcp",
      roundtripMs: result.roundtripMs,
      payload: result.result
    };
  }
}

