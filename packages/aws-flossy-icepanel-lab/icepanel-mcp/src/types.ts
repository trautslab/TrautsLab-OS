/**
 * icepanel-mcp/src/types.ts
 * Types for Model Context Protocol (MCP) & IcePanel C4 Entities
 */

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface IcePanelSystem {
  id: string;
  name: string;
  description: string;
  bianDomainId?: string;
  controlRecord?: string;
  tags?: string[];
}

export interface IcePanelComponent {
  id: string;
  systemId: string;
  name: string;
  archetype: 'Command' | 'Query' | 'Projection' | 'Plug for Integration' | 'Step Function' | 'Alarms' | 'EventBridge';
  description: string;
  technology: string;
  awsService: string;
  tags?: string[];
}

export interface IcePanelConnection {
  id: string;
  from: string;
  to: string;
  protocol: string;
  description: string;
}

export interface IcePanelFlowStep {
  step: number;
  source: string;
  target: string;
  type: string;
  action: string;
}

export interface IcePanelFlow {
  id: string;
  name: string;
  description: string;
  primaryDomain: string;
  steps: IcePanelFlowStep[];
}

export interface IcePanelLandscapeModel {
  version: string;
  landscape: {
    name: string;
    description: string;
    organization: string;
  };
  systems: IcePanelSystem[];
  apps: IcePanelComponent[];
  stores: Array<{ id: string; name: string; technology: string; description: string; systemId?: string }>;
  connections: IcePanelConnection[];
  flows: IcePanelFlow[];
  tags: Array<{ id: string; name: string; color: string }>;
}

