/**
 * likec4-emitter.mjs
 * Generates valid LikeC4 DSL conforming to strict grammar:
 * - Tags (#tag) MUST come first inside element bodies
 * - Only standard colors: primary, secondary, muted, slate, blue, indigo, sky, red, green, amber, gray
 * - Includes both BIAN 80-repo squad and the 16-repo Agentic ACG->ACR->LMB/EKS ecosystem
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function emitLikeC4Model(enrichedManifest, flowsCatalog) {
  let c4 = `// ==============================================================================\n`;
  c4 += `// LikeC4 Architecture Model - BIAN Core Banking & Agentic Native Rails\n`;
  c4 += `// Strict grammar compliant: Tags first, valid semantic colors\n`;
  c4 += `// ==============================================================================\n\n`;

  // 1. SPECIFICATION
  c4 += `specification {\n`;
  c4 += `  element domain {\n`;
  c4 += `    style {\n`;
  c4 += `      shape rectangle\n`;
  c4 += `      color slate\n`;
  c4 += `    }\n`;
  c4 += `  }\n`;
  c4 += `  element commandApp {\n`;
  c4 += `    style {\n`;
  c4 += `      shape rectangle\n`;
  c4 += `      color red\n`;
  c4 += `    }\n`;
  c4 += `  }\n`;
  c4 += `  element queryApp {\n`;
  c4 += `    style {\n`;
  c4 += `      shape rectangle\n`;
  c4 += `      color green\n`;
  c4 += `    }\n`;
  c4 += `  }\n`;
  c4 += `  element projectionApp {\n`;
  c4 += `    style {\n`;
  c4 += `      shape rectangle\n`;
  c4 += `      color sky\n`;
  c4 += `    }\n`;
  c4 += `  }\n`;
  c4 += `  element plugApp {\n`;
  c4 += `    style {\n`;
  c4 += `      shape rectangle\n`;
  c4 += `      color amber\n`;
  c4 += `    }\n`;
  c4 += `  }\n`;
  c4 += `  element sfnApp {\n`;
  c4 += `    style {\n`;
  c4 += `      shape rectangle\n`;
  c4 += `      color indigo\n`;
  c4 += `    }\n`;
  c4 += `  }\n`;
  c4 += `  element alarmApp {\n`;
  c4 += `    style {\n`;
  c4 += `      shape rectangle\n`;
  c4 += `      color red\n`;
  c4 += `    }\n`;
  c4 += `  }\n`;
  c4 += `  element eventbus {\n`;
  c4 += `    style {\n`;
  c4 += `      shape queue\n`;
  c4 += `      color indigo\n`;
  c4 += `    }\n`;
  c4 += `  }\n`;
  c4 += `  element datastore {\n`;
  c4 += `    style {\n`;
  c4 += `      shape storage\n`;
  c4 += `      color slate\n`;
  c4 += `    }\n`;
  c4 += `  }\n`;
  c4 += `  element gateway {\n`;
  c4 += `    style {\n`;
  c4 += `      shape rectangle\n`;
  c4 += `      color indigo\n`;
  c4 += `    }\n`;
  c4 += `  }\n`;
  c4 += `  element agentRuntime {\n`;
  c4 += `    style {\n`;
  c4 += `      shape rectangle\n`;
  c4 += `      color blue\n`;
  c4 += `    }\n`;
  c4 += `  }\n`;
  c4 += `  element plannedApp {\n`;
  c4 += `    style {\n`;
  c4 += `      shape rectangle\n`;
  c4 += `      color amber\n`;
  c4 += `    }\n`;
  c4 += `  }\n`;
  c4 += `  element brokenApp {\n`;
  c4 += `    style {\n`;
  c4 += `      shape rectangle\n`;
  c4 += `      color red\n`;
  c4 += `    }\n`;
  c4 += `  }\n`;
  c4 += `  element containerCluster {\n`;
  c4 += `    style {\n`;
  c4 += `      shape rectangle\n`;
  c4 += `      color blue\n`;
  c4 += `    }\n`;
  c4 += `  }\n`;
  c4 += `  element externalLLM {\n`;
  c4 += `    style {\n`;
  c4 += `      shape person\n`;
  c4 += `      color slate\n`;
  c4 += `    }\n`;
  c4 += `  }\n`;
  c4 += `  tag bcp\n`;
  c4 += `  tag bian\n`;
  c4 += `  tag aws\n`;
  c4 += `  tag squad\n`;
  c4 += `  tag active\n`;
  c4 += `  tag to_create\n`;
  c4 += `  tag non_existent\n`;
  c4 += `}\n\n`;

  // 2. MODEL
  c4 += `model {\n`;
  c4 += `  // Central Event Backbone\n`;
  c4 += `  eventbridge_bus = eventbus 'Core Banking EventBus' {\n`;
  c4 += `    #aws\n`;
  c4 += `    description 'Amazon EventBridge Central Enterprise Backbone'\n`;
  c4 += `    technology 'Amazon EventBridge'\n`;
  c4 += `  }\n\n`;

  // --- AGENTIC ECOSYSTEM: ACG -> ACR (MCP) -> LMB / EKS ---
  c4 += `  external_llm = externalLLM 'External LLM Consumers' {\n`;
  c4 += `    description 'External Agentic Workflows, Copilots, and Mobile Assistants'\n`;
  c4 += `  }\n\n`;

  c4 += `  acg_gateway = gateway 'acg-{env}-io-semantic-router-01' {\n`;
  c4 += `    #aws #active\n`;
  c4 += `    description 'Agent Core Gateway: Auth, Semantic Routing, Rate Limiting & MCP Proxy'\n`;
  c4 += `    technology 'Amazon API Gateway HTTP / ECS Envoy'\n`;
  c4 += `  }\n\n`;

  c4 += `  subgraph_acr = domain 'Agent Core Runtime (ACR) Cluster' {\n`;
  c4 += `    #squad\n`;
  c4 += `    description 'MCP Tool Servers hosting domain capabilities (Active & Planned)'\n\n`;

  c4 += `    acr_vads_coupons = agentRuntime 'acr_{env}_io_vads_coupons_mcp_01' {\n`;
  c4 += `      #active #squad\n`;
  c4 += `      description '[ACTIVO] MCP Server for coupons operations'\n`;
  c4 += `      technology 'Node.js 20, MCP stdio/SSE'\n`;
  c4 += `    }\n`;

  c4 += `    acr_vads_cashback = agentRuntime 'acr_{env}_io_vads_cashback_mcp_01' {\n`;
  c4 += `      #active #squad\n`;
  c4 += `      description '[ACTIVO] MCP Server for cashback benefits'\n`;
  c4 += `      technology 'Node.js 20, MCP stdio/SSE'\n`;
  c4 += `    }\n`;

  c4 += `    acr_sale_campaign = plannedApp 'acr-io-sale-campaign-mcp-01' {\n`;
  c4 += `      #to_create #squad\n`;
  c4 += `      description '[POR CREAR] MCP Server for marketing & sales campaign tools'\n`;
  c4 += `      technology 'TypeScript, MCP'\n`;
  c4 += `    }\n`;

  c4 += `    acr_reward_point_acc = agentRuntime 'acr_{env}_io_acse_reward_point_acc_mcp_01' {\n`;
  c4 += `      #active #squad\n`;
  c4 += `      description '[ACTIVO] MCP Server for loyalty points account & balances'\n`;
  c4 += `      technology 'Node.js, MCP'\n`;
  c4 += `    }\n`;

  c4 += `    acr_reward_point_ar = plannedApp 'acr_{env}_io_opse_reward_point_ar_mcp_01' {\n`;
  c4 += `      #to_create #squad\n`;
  c4 += `      description '[POR CREAR] MCP Server for points accrual and redemption operations'\n`;
  c4 += `      technology 'Node.js 20, MCP'\n`;
  c4 += `    }\n`;

  c4 += `    acr_made_campaign_dsg = agentRuntime 'acr_{env}_io_made_campaign_dsg_mcp_01' {\n`;
  c4 += `      #active #squad\n`;
  c4 += `      description '[ACTIVO] MCP Server for campaign design rules'\n`;
  c4 += `      technology 'TypeScript, MCP'\n`;
  c4 += `    }\n`;
  c4 += `  }\n\n`;

  c4 += `  subgraph_backend = domain 'Backend Microservices & Lambda Finders' {\n`;
  c4 += `    #aws\n`;
  c4 += `    description 'Granular serverless query handlers and containerized core'\n\n`;

  c4 += `    lmb_coupons_non_expired = queryApp 'lmb-matrix-findby-non-expired-coupons-qry-svc-01' {\n`;
  c4 += `      #active #aws\n`;
  c4 += `      description '[ACTIVO] Finder query for active, non-expired coupons'\n`;
  c4 += `      technology 'AWS Lambda, Go 1.22'\n`;
  c4 += `    }\n`;

  c4 += `    lmb_coupons_by_id = queryApp 'lmb-matrix-findby-id-coupons-qry-svc-01' {\n`;
  c4 += `      #active #aws\n`;
  c4 += `      description '[ACTIVO] Finder query for coupon details by ID'\n`;
  c4 += `      technology 'AWS Lambda, Node.js 20'\n`;
  c4 += `    }\n`;

  c4 += `    lmb_coupons_by_dep = queryApp 'lmb-matrix-findby-dep-coupons-qry-svc-01' {\n`;
  c4 += `      #active #aws\n`;
  c4 += `      description '[ACTIVO] Finder query for department coupons'\n`;
  c4 += `      technology 'AWS Lambda, Node.js 20'\n`;
  c4 += `    }\n`;

  c4 += `    lmb_matrix_env_coupons_by_id = queryApp 'lmb-(env)-matrix-findby-id-coupons-qry-svc-01' {\n`;
  c4 += `      #active #aws\n`;
  c4 += `      description '[ACTIVO] Environment-scoped coupon finder service'\n`;
  c4 += `      technology 'AWS Lambda, Node.js 20'\n`;
  c4 += `    }\n`;

  c4 += `    lmb_sale_cust_cpgn = queryApp 'lmb-(env)-io-sale-cust-cpgn-ex-qry_findby-01' {\n`;
  c4 += `      #active #aws\n`;
  c4 += `      description '[ACTIVO] Customer campaign execution query finder'\n`;
  c4 += `      technology 'AWS Lambda, TypeScript'\n`;
  c4 += `    }\n`;

  c4 += `    lmb_sale_campaign_exec = plannedApp 'lmb-{env}-io-sale-campaign-exec--qry_findby-01' {\n`;
  c4 += `      #to_create #aws\n`;
  c4 += `      description '[POR CREAR] Query service for campaign execution details'\n`;
  c4 += `      technology 'AWS Lambda, TypeScript'\n`;
  c4 += `    }\n`;

  c4 += `    lmb_opse_reward_ar = plannedApp 'lmb-{env}-io-opse-reward-point-ar-qry-01' {\n`;
  c4 += `      #to_create #aws\n`;
  c4 += `      description '[POR CREAR] Query service for points operation records'\n`;
  c4 += `      technology 'AWS Lambda, Python 3.11'\n`;
  c4 += `    }\n`;

  c4 += `    lmb_acse_reward_acc = queryApp 'lmb-(env)-io-acse-reward-point-acc-qry_findby-01' {\n`;
  c4 += `      #active #aws\n`;
  c4 += `      description '[ACTIVO] Loyalty points account and balance finder'\n`;
  c4 += `      technology 'AWS Lambda, Python 3.11'\n`;
  c4 += `    }\n`;

  c4 += `    lmb_made_campaign_pjc = brokenApp 'lmb-(env)-io-made-campaign-dsg-pjc_findby-id-01' {\n`;
  c4 += `      #non_existent #aws\n`;
  c4 += `      description '[NO EXISTE] Missing projection finder -> Triggers 502 Bad Gateway'\n`;
  c4 += `      technology 'Phantom Lambda Service'\n`;
  c4 += `    }\n`;

  c4 += `    eks_cluster = containerCluster 'eks-{env}-io-01' {\n`;
  c4 += `      #active #aws\n`;
  c4 += `      description '[ACTIVO] EKS Cluster hosting high-throughput transactional services'\n`;
  c4 += `      technology 'Amazon EKS'\n`;
  c4 += `    }\n`;
  c4 += `  }\n\n`;

  // Wiring Agentic Flow
  c4 += `  external_llm -> acg_gateway 'Prompts & Multi-Tool Calls'\n`;
  c4 += `  acg_gateway -> acr_vads_coupons 'Routes coupons.*'\n`;
  c4 += `  acg_gateway -> acr_vads_cashback 'Routes cashback.*'\n`;
  c4 += `  acg_gateway -> acr_sale_campaign 'Routes campaigns.* [POR CREAR: Ambiguity]'\n`;
  c4 += `  acg_gateway -> acr_reward_point_acc 'Routes points.*'\n`;
  c4 += `  acg_gateway -> acr_reward_point_ar 'Routes accrual.* [POR CREAR]'\n`;
  c4 += `  acg_gateway -> acr_made_campaign_dsg 'Routes design.*'\n`;

  c4 += `  acr_vads_coupons -> lmb_coupons_non_expired 'Invokes non-expired finder'\n`;
  c4 += `  acr_vads_coupons -> lmb_coupons_by_id 'Invokes by-ID finder'\n`;
  c4 += `  acr_vads_coupons -> lmb_coupons_by_dep 'Invokes department finder'\n`;
  c4 += `  acr_vads_coupons -> lmb_matrix_env_coupons_by_id 'Invokes env finder'\n`;
  c4 += `  acr_sale_campaign -> lmb_sale_campaign_exec '[POR CREAR] Invokes campaign finder'\n`;
  c4 += `  acr_sale_campaign -> lmb_sale_cust_cpgn 'Invokes customer campaign query'\n`;
  c4 += `  acr_reward_point_acc -> lmb_acse_reward_acc 'Invokes points query [Race Condition]'\n`;
  c4 += `  acr_reward_point_ar -> lmb_opse_reward_ar '[POR CREAR] Invokes accrual query'\n`;
  c4 += `  acr_made_campaign_dsg -> lmb_made_campaign_pjc 'Invokes projection [NO EXISTE: 502 Collision]'\n`;
  c4 += `  acr_vads_cashback -> eks_cluster 'Dispatches cashback transaction'\n\n`;

  // --- BIAN 11 DOMAINS & 80 REPOSITORIES ---
  for (const domain of enrichedManifest.domains) {
    const safeDomainId = `dom_${domain.domainIndex}`;
    const domainTitle = `${domain.bianInfo ? domain.bianInfo.id : 'SD'}: ${domain.name}`;
    const domainDesc = domain.bianInfo ? domain.bianInfo.description : domain.name;

    c4 += `  ${safeDomainId} = domain '${domainTitle}' {\n`;
    c4 += `    #bian\n`;
    c4 += `    description '${domainDesc.replace(/'/g, "\\'")}'\n\n`;

    const domainStoreId = `store_db_${domain.domainIndex}`;
    c4 += `    ${domainStoreId} = datastore '${domain.name} Storage' {\n`;
    c4 += `      #aws\n`;
    c4 += `      description 'Persistence and cache views for ${domain.name}'\n`;
    c4 += `      technology 'Amazon DynamoDB & Redis'\n`;
    c4 += `    }\n\n`;

    for (const repo of domain.repos) {
      const safeRepoId = repo.name.replace(/[^a-zA-Z0-9]/g, '_');
      let elementType = 'commandApp';
      const arch = repo.archetype.toLowerCase();
      if (arch.includes('query')) elementType = 'queryApp';
      else if (arch.includes('projection')) elementType = 'projectionApp';
      else if (arch.includes('plug')) elementType = 'plugApp';
      else if (arch.includes('step function')) elementType = 'sfnApp';
      else if (arch.includes('alarms')) elementType = 'alarmApp';

      c4 += `    ${safeRepoId} = ${elementType} '${repo.name}' {\n`;
      c4 += `      #squad #aws\n`;
      c4 += `      description '${repo.description.replace(/'/g, "\\'")}'\n`;
      c4 += `      technology '${repo.techStack.replace(/'/g, "\\'")}'\n`;
      c4 += `    }\n\n`;

      c4 += `    ${safeRepoId} -> ${domainStoreId} 'accesses persistence'\n`;

      if (arch.includes('command') || arch.includes('projection') || arch.includes('step function')) {
        const verb = arch.includes('command') ? 'emits domain events to' : 'subscribes to events from';
        c4 += `    ${safeRepoId} -> eventbridge_bus '${verb}'\n`;
      }
    }

    c4 += `  }\n\n`;
  }

  c4 += `}\n\n`;

  // 3. VIEWS
  c4 += `views {\n`;
  c4 += `  view index {\n`;
  c4 += `    title 'Core Banking BIAN Architecture Landscape (11 Domains)'\n`;
  c4 += `    include *\n`;
  c4 += `  }\n\n`;

  // Agentic Topology View
  c4 += `  view view_acg_acr_architecture {\n`;
  c4 += `    title 'Agentic Topology: ACG Gateway -> ACR (MCP) -> Lambda / EKS'\n`;
  c4 += `    include external_llm, acg_gateway, subgraph_acr, subgraph_acr.*, subgraph_backend, subgraph_backend.*\n`;
  c4 += `  }\n\n`;

  // Dynamic Flow: Collision Diorama
  c4 += `  dynamic view acg_collision_diorama {\n`;
  c4 += `    title 'DIORAMA: 4 Collision Points & Phantom / Uncreated Dependencies'\n`;
  c4 += `    external_llm -> acg_gateway '1. LLMs fire concurrent ambiguous queries'\n`;
  c4 += `    acg_gateway -> acr_sale_campaign '2. [COLLISION 1] Ambiguity on POR CREAR tool'\n`;
  c4 += `    acg_gateway -> acr_made_campaign_dsg '3. Route to campaign design MCP'\n`;
  c4 += `    acr_made_campaign_dsg -> lmb_made_campaign_pjc '4. [COLLISION 2] Calls NO EXISTE Lambda -> 502 Bad Gateway'\n`;
  c4 += `    acg_gateway -> acr_reward_point_acc '5. [COLLISION 3] Concurrent mutations without lock'\n`;
  c4 += `    acr_reward_point_acc -> lmb_acse_reward_acc '6. Double-spend race condition on loyalty balance'\n`;
  c4 += `    lmb_coupons_non_expired -> acr_vads_coupons '7. [COLLISION 4] Unpaginated 3MB payload -> Context Window Bloat'\n`;
  c4 += `  }\n\n`;

  for (const domain of enrichedManifest.domains) {
    const safeDomainId = `dom_${domain.domainIndex}`;
    c4 += `  view view_${safeDomainId} of ${safeDomainId} {\n`;
    c4 += `    title '${domain.bianInfo ? domain.bianInfo.id : ''}: ${domain.name} Components'\n`;
    c4 += `    include ${safeDomainId}.*\n`;
    c4 += `    include eventbridge_bus\n`;
    c4 += `  }\n\n`;
  }

  // Exemplary Dynamic Flow View (FLOW-02 Instant P2P Transfer)
  c4 += `  dynamic view flow_02_instant_p2p {\n`;
  c4 += `    title 'FLOW-02: Outbound Instant P2P Transfer'\n`;
  c4 += `    dom_2.cmd_payment_execution_initiate -> dom_3.qry_party_routing_resolve '1. Resolve phone to CCI'\n`;
  c4 += `    dom_2.cmd_payment_execution_initiate -> dom_9.cmd_fraud_detection_evaluate_tx '2. Realtime fraud risk score'\n`;
  c4 += `    dom_2.cmd_payment_execution_initiate -> dom_2.sfn_payment_instant_transfer_saga '3. Start transfer saga'\n`;
  c4 += `    dom_2.sfn_payment_instant_transfer_saga -> dom_6.cmd_position_keeping_reserve '4. Hold source balance'\n`;
  c4 += `    dom_2.sfn_payment_instant_transfer_saga -> dom_3.plug_directory_federation_bridge '5. Dispatch instant rail'\n`;
  c4 += `    dom_2.sfn_payment_instant_transfer_saga -> dom_6.cmd_position_keeping_release '6. Release hold & commit debit'\n`;
  c4 += `    dom_2.sfn_payment_instant_transfer_saga -> eventbridge_bus '7. Emit PaymentCompletedEvent'\n`;
  c4 += `    eventbridge_bus -> dom_10.cmd_customer_alert_dispatch '8. Dispatch push notification'\n`;
  c4 += `  }\n\n`;

  // Dynamic Flow View for FLOW-01 Digital Onboarding
  c4 += `  dynamic view flow_01_digital_onboarding {\n`;
  c4 += `    title 'FLOW-01: Direct Digital Account Opening & KYC'\n`;
  c4 += `    dom_4.cmd_customer_onboarding_initiate -> dom_4.sfn_customer_onboarding_saga '1. Initiate onboarding saga'\n`;
  c4 += `    dom_4.sfn_customer_onboarding_saga -> dom_4.plug_reniec_biometrics_gateway '2. Validate RENIEC biometrics'\n`;
  c4 += `    dom_4.sfn_customer_onboarding_saga -> dom_5.cmd_customer_agreement_sign '3. Sign legal contract'\n`;
  c4 += `    dom_4.sfn_customer_onboarding_saga -> dom_1.cmd_current_account_lifecycle '4. Activate Current Account'\n`;
  c4 += `    dom_1.cmd_current_account_lifecycle -> eventbridge_bus '5. Emit AccountOpenedEvent'\n`;
  c4 += `    eventbridge_bus -> dom_10.cmd_customer_alert_dispatch '6. Welcome SMS alert'\n`;
  c4 += `  }\n`;

  c4 += `}\n`;

  return c4;
}
