/**
 * icepanel-emitter.mjs
 * Generates official IcePanel C4 Landscape JSON models and Mermaid C4 architecture diagrams.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function emitIcePanelLandscape(enrichedManifest, flowsCatalog) {
  const landscape = {
    version: '1.0.0',
    landscape: {
      name: 'Retail Core Banking & Transactional Rails (BIAN Architecture)',
      description: 'Squad Cuentas & Rieles Transaccionales: 11 BIAN Service Domains, 80 Repositories, 20 Flows on AWS',
      organization: 'TrautsLab OS / Retail Banking'
    },
    tags: [
      { id: 'tag-aws', name: 'AWS Cloud', color: '#FF9900' },
      { id: 'tag-bian', name: 'BIAN v10', color: '#006699' },
      { id: 'tag-cmd', name: 'Command (Write)', color: '#D9534F' },
      { id: 'tag-qry', name: 'Query (Read)', color: '#5CB85C' },
      { id: 'tag-prj', name: 'Projection', color: '#5BC0DE' },
      { id: 'tag-plug', name: 'Plug Integration', color: '#F0AD4E' },
      { id: 'tag-sfn', name: 'Step Function Saga', color: '#9B59B6' },
      { id: 'tag-alm', name: 'Alarms & SLO', color: '#E74C3C' },
      { id: 'tag-evb', name: 'EventBridge Bus', color: '#34495E' }
    ],
    systems: [],
    apps: [],
    stores: [],
    connections: [],
    flows: []
  };

  // 1. Central Event Store (EventBridge Backbone)
  const eventBusStoreId = 'store-eventbridge-core-bus';
  landscape.stores.push({
    id: eventBusStoreId,
    name: 'EventBridge Core Banking EventBus',
    description: 'Central event broker routing all transactional, lifecycle, and audit domain events',
    technology: 'Amazon EventBridge',
    tags: ['tag-aws', 'tag-evb']
  });

  // 2. Iterate Domains (Systems in IcePanel C4)
  for (const domain of enrichedManifest.domains) {
    const systemId = `sys-domain-${domain.domainIndex}`;
    landscape.systems.push({
      id: systemId,
      name: `${domain.bianInfo ? domain.bianInfo.id : 'SD'}: ${domain.name}`,
      description: domain.bianInfo ? domain.bianInfo.description : domain.name,
      controlRecord: domain.bianInfo ? domain.bianInfo.controlRecord : 'N/A',
      tags: ['tag-bian']
    });

    // Add Domain Stores if applicable (e.g. Master DynamoDB, DAX, Redis)
    const domainStoreId = `store-db-domain-${domain.domainIndex}`;
    landscape.stores.push({
      id: domainStoreId,
      name: `${domain.name} Storage Layer`,
      systemId,
      description: `Primary persistence and read projections for ${domain.name}`,
      technology: 'Amazon DynamoDB & Redis Cache',
      tags: ['tag-aws']
    });

    // Iterate Repositories (Apps in IcePanel C4)
    for (const repo of domain.repos) {
      const appId = `app-${repo.name}`;
      
      let tagId = 'tag-cmd';
      const arch = repo.archetype.toLowerCase();
      if (arch.includes('query')) tagId = 'tag-qry';
      else if (arch.includes('projection')) tagId = 'tag-prj';
      else if (arch.includes('plug')) tagId = 'tag-plug';
      else if (arch.includes('step function')) tagId = 'tag-sfn';
      else if (arch.includes('alarms')) tagId = 'tag-alm';

      landscape.apps.push({
        id: appId,
        systemId,
        name: repo.name,
        archetype: repo.archetype,
        description: repo.description,
        technology: repo.techStack,
        awsService: repo.awsService,
        bianDomainId: repo.bianDomainId,
        bianControlRecord: repo.bianControlRecord,
        bianOperation: repo.bianServiceOperation,
        tags: ['tag-aws', tagId]
      });

      // Connect App to Domain Store
      landscape.connections.push({
        id: `conn-${appId}-${domainStoreId}`,
        from: appId,
        to: domainStoreId,
        protocol: 'AWS SDK / HTTPS',
        description: `${repo.archetype} persistence / read access`
      });

      // Connect Command and Projection apps to EventBridge
      if (arch.includes('command') || arch.includes('projection') || arch.includes('step function')) {
        landscape.connections.push({
          id: `conn-${appId}-${eventBusStoreId}`,
          from: appId,
          to: eventBusStoreId,
          protocol: 'EventBridge API / PutEvents',
          description: arch.includes('command') ? 'Publishes Domain Events' : 'Consumes Domain Events'
        });
      }
    }
  }

  // 3. Populate Interactive Flows
  if (flowsCatalog && flowsCatalog.flows) {
    for (const flow of flowsCatalog.flows) {
      landscape.flows.push({
        id: flow.id,
        name: flow.name,
        description: flow.description,
        primaryDomain: flow.primaryDomain,
        steps: flow.steps.map((st) => ({
          step: st.step,
          sourceApp: `app-${st.source}`,
          targetApp: `app-${st.target}`,
          type: st.type,
          action: st.action
        }))
      });
    }
  }

  return landscape;
}

export function emitMermaidDiagram(enrichedManifest, flowsCatalog) {
  let mermaid = `%% Mermaid C4 Diagram - Retail Core Banking Squad (11 Domains, 80 Repositories, 20 Flows)\n`;
  mermaid += `graph TB\n`;
  mermaid += `  classDef domainBox fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;\n`;
  mermaid += `  classDef cmdStyle fill:#ef4444,stroke:#7f1d1d,stroke-width:1px,color:#ffffff;\n`;
  mermaid += `  classDef qryStyle fill:#22c55e,stroke:#14532d,stroke-width:1px,color:#ffffff;\n`;
  mermaid += `  classDef prjStyle fill:#06b6d4,stroke:#164e63,stroke-width:1px,color:#ffffff;\n`;
  mermaid += `  classDef plugStyle fill:#f59e0b,stroke:#78350f,stroke-width:1px,color:#ffffff;\n`;
  mermaid += `  classDef sfnStyle fill:#a855f7,stroke:#581c87,stroke-width:1px,color:#ffffff;\n`;
  mermaid += `  classDef almStyle fill:#f43f5e,stroke:#881337,stroke-width:1px,color:#ffffff;\n`;
  mermaid += `  classDef busStyle fill:#334155,stroke:#94a3b8,stroke-width:3px,color:#f8fafc;\n\n`;

  mermaid += `  subgraph Backbone["⚡ Enterprise Event Backbone"]\n`;
  mermaid += `    EventBus[("Amazon EventBridge Core Banking Bus")]:::busStyle\n`;
  mermaid += `  end\n\n`;

  for (const domain of enrichedManifest.domains) {
    const safeDomainName = domain.name.replace(/[^a-zA-Z0-9]/g, '_');
    mermaid += `  subgraph Sub_${safeDomainName}["🏛️ ${domain.bianInfo ? domain.bianInfo.id : ''}: ${domain.name}"]\n`;
    for (const repo of domain.repos) {
      const safeRepoId = repo.name.replace(/[^a-zA-Z0-9]/g, '_');
      let styleClass = 'cmdStyle';
      const arch = repo.archetype.toLowerCase();
      if (arch.includes('query')) styleClass = 'qryStyle';
      else if (arch.includes('projection')) styleClass = 'prjStyle';
      else if (arch.includes('plug')) styleClass = 'plugStyle';
      else if (arch.includes('step function')) styleClass = 'sfnStyle';
      else if (arch.includes('alarms')) styleClass = 'almStyle';

      mermaid += `    ${safeRepoId}["${repo.name}<br/><i>(${repo.archetype})</i>"]:::${styleClass}\n`;
    }
    mermaid += `  end\n\n`;
  }

  // Connect sample key flows
  mermaid += `  %% Exemplary Core Flow: Instant P2P Transfer (FLOW-02)\n`;
  mermaid += `  cmd_payment_execution_initiate -->|1. Resolve| qry_party_routing_resolve\n`;
  mermaid += `  cmd_payment_execution_initiate -->|2. Fraud Score| cmd_fraud_detection_evaluate_tx\n`;
  mermaid += `  cmd_payment_execution_initiate -->|3. Start Saga| sfn_payment_instant_transfer_saga\n`;
  mermaid += `  sfn_payment_instant_transfer_saga -->|4. Hold Funds| cmd_position_keeping_reserve\n`;
  mermaid += `  sfn_payment_instant_transfer_saga -->|5. Instant Rail| plug_directory_federation_bridge\n`;
  mermaid += `  sfn_payment_instant_transfer_saga -->|6. Commit| cmd_position_keeping_release\n`;
  mermaid += `  sfn_payment_instant_transfer_saga -->|7. Outbox Event| EventBus\n`;
  mermaid += `  EventBus -.->|Event Subscription| prj_payment_execution_history\n`;
  mermaid += `  EventBus -.->|Event Subscription| cmd_customer_alert_dispatch\n`;
  mermaid += `  cmd_customer_alert_dispatch -->|Push| plug_fcm_apns_push_gateway\n`;

  return mermaid;
}

