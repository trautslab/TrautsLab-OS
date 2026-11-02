#!/usr/bin/env node
/**
 * icepanel-mcp/src/server.ts
 * Standalone JSON-RPC 2.0 Model Context Protocol (MCP) Server for IcePanel.
 * Compatible with Claude Code, Cursor, Antigravity, and Minions.
 */
import readline from 'node:readline';
import { IcePanelClient } from './icepanel-client.js';

const client = new IcePanelClient();

const TOOLS = [
  {
    name: 'icepanel_create_domain',
    description: 'Registers a BIAN Service Domain as a System boundary in the IcePanel C4 Landscape.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'System identifier (e.g., sys-current-account)' },
        name: { type: 'string', description: 'Display name of the BIAN Service Domain' },
        description: { type: 'string', description: 'Scope and responsibilities of the domain' },
        bianDomainId: { type: 'string', description: 'BIAN Domain ID (e.g. SD-01)' },
        controlRecord: { type: 'string', description: 'BIAN Control Record name' }
      },
      required: ['id', 'name', 'description']
    }
  },
  {
    name: 'icepanel_create_component',
    description: 'Registers a repository or microservice as an App/Component in IcePanel with an architectural archetype.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Component unique identifier (e.g. app-cmd-current-account-deposits)' },
        systemId: { type: 'string', description: 'System boundary ID to which this component belongs' },
        name: { type: 'string', description: 'Repository or microservice name' },
        archetype: {
          type: 'string',
          enum: ['Command', 'Query', 'Projection', 'Plug for Integration', 'Step Function', 'Alarms', 'EventBridge'],
          description: 'Architectural archetype'
        },
        description: { type: 'string', description: 'Detailed responsibility description' },
        technology: { type: 'string', description: 'Tech stack (e.g. TypeScript, Node.js, Go, Rust)' },
        awsService: { type: 'string', description: 'Underlying AWS service (e.g. AWS Lambda, Step Functions)' }
      },
      required: ['id', 'systemId', 'name', 'archetype', 'description']
    }
  },
  {
    name: 'icepanel_create_connection',
    description: 'Draws a relationship or communication channel between two IcePanel entities.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Connection ID' },
        from: { type: 'string', description: 'Source component ID' },
        to: { type: 'string', description: 'Target component or store ID' },
        protocol: { type: 'string', description: 'Protocol or interaction mode (e.g. EventBridge, SQS, REST, gRPC)' },
        description: { type: 'string', description: 'Reason for connection' }
      },
      required: ['id', 'from', 'to', 'protocol']
    }
  },
  {
    name: 'icepanel_create_flow',
    description: 'Registers a multi-step interactive business flow showing message hops across components.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Flow ID (e.g., FLOW-02)' },
        name: { type: 'string', description: 'Business flow name' },
        description: { type: 'string', description: 'Description of the end-to-end journey' },
        primaryDomain: { type: 'string', description: 'Primary BIAN Domain governing the flow' },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              source: { type: 'string' },
              target: { type: 'string' },
              type: { type: 'string' },
              action: { type: 'string' }
            },
            required: ['step', 'source', 'target', 'action']
          }
        }
      },
      required: ['id', 'name', 'primaryDomain', 'steps']
    }
  },
  {
    name: 'icepanel_export_landscape',
    description: 'Exports the full C4 model landscape JSON file and summary statistics.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'icepanel_sync_terraform',
    description: 'Synchronizes deployed AWS infrastructure resources from Terraform/Floci state into IcePanel.',
    inputSchema: {
      type: 'object',
      properties: {
        resources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              name: { type: 'string' },
              arn: { type: 'string' },
              archetype: { type: 'string' },
              domain: { type: 'string' }
            },
            required: ['type', 'name', 'archetype', 'domain']
          }
        }
      },
      required: ['resources']
    }
  }
];

async function handleToolCall(name: string, args: any) {
  switch (name) {
    case 'icepanel_create_domain':
      return await client.createDomain(args);
    case 'icepanel_create_component':
      return await client.createComponent(args);
    case 'icepanel_create_connection':
      return await client.createConnection(args);
    case 'icepanel_create_flow':
      return await client.createFlow(args);
    case 'icepanel_export_landscape':
      return await client.exportLandscape();
    case 'icepanel_sync_terraform':
      return await client.syncTerraform(args.resources);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Stdio JSON-RPC Loop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const request = JSON.parse(trimmed);
    const { id, method, params } = request;

    if (method === 'initialize') {
      const response = {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: {
            name: 'icepanel-mcp-server',
            version: '1.0.0'
          }
        }
      };
      process.stdout.write(JSON.stringify(response) + '\n');
      return;
    }

    if (method === 'tools/list') {
      const response = {
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS }
      };
      process.stdout.write(JSON.stringify(response) + '\n');
      return;
    }

    if (method === 'tools/call') {
      const { name, arguments: toolArgs } = params;
      try {
        const result = await handleToolCall(name, toolArgs || {});
        const response = {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
          }
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (toolError: any) {
        const response = {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32000,
            message: toolError.message || 'Tool execution error'
          }
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      }
      return;
    }

    // Default unknown method
    const response = {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    };
    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (err: any) {
    const errorResponse = {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: `Parse error: ${err.message}` }
    };
    process.stdout.write(JSON.stringify(errorResponse) + '\n');
  }
});

