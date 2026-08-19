/**
 * TrautsLab OS — Model Context Protocol (MCP) Server
 * Handles JSON-RPC 2.0 requests over stdio (standard input/output).
 */

import readline from 'node:readline';
import { MCPToolsRegistry } from './tools.js';
import { MCPRequest, MCPResponse } from './types.js';

export interface MCPServerOptions {
  vaultRoot: string;
  serverName?: string;
  serverVersion?: string;
}

export class MCPServer {
  private vaultRoot: string;
  private serverName: string;
  private serverVersion: string;
  private toolsRegistry: MCPToolsRegistry;

  constructor(options: MCPServerOptions) {
    this.vaultRoot = options.vaultRoot;
    this.serverName = options.serverName || 'trautslab-os-mcp';
    this.serverVersion = options.serverVersion || '1.0.0';
    this.toolsRegistry = new MCPToolsRegistry(this.vaultRoot);
  }

  /**
   * Handle single JSON-RPC 2.0 request
   */
  public async handleRequest(req: MCPRequest): Promise<MCPResponse> {
    const { id, method, params } = req;

    switch (method) {
      case 'initialize': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: { listChanged: false },
              resources: { subscribe: false, listChanged: false }
            },
            serverInfo: {
              name: this.serverName,
              version: this.serverVersion
            }
          }
        };
      }

      case 'notifications/initialized': {
        // Notification ack
        return {
          jsonrpc: '2.0',
          id,
          result: {}
        };
      }

      case 'tools/list': {
        const tools = this.toolsRegistry.getToolDefinitions();
        return {
          jsonrpc: '2.0',
          id,
          result: { tools }
        };
      }

      case 'tools/call': {
        const name = params?.name;
        const args = params?.arguments || {};
        if (!name) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Falta el parámetro "name" de la herramienta.' }
          };
        }

        const toolResult = await this.toolsRegistry.executeTool(name, args);
        return {
          jsonrpc: '2.0',
          id,
          result: toolResult
        };
      }

      case 'resources/list': {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            resources: [
              {
                uri: 'vault://WIKI/index.md',
                name: 'Tabla de Contenidos Maestra (Vault Navigation Index)',
                mimeType: 'text/markdown'
              },
              {
                uri: 'vault://AGENTS.md',
                name: 'Mapa del Sistema e Instrucciones para Agentes',
                mimeType: 'text/markdown'
              }
            ]
          }
        };
      }

      case 'resources/read': {
        const uri = String(params?.uri || '');
        const relPath = uri.replace(/^vault:\/\//, '');
        const result = await this.toolsRegistry.executeTool('trautslab_vault_read', { relativePath: relPath });
        return {
          jsonrpc: '2.0',
          id,
          result: {
            contents: [
              {
                uri,
                mimeType: 'text/markdown',
                text: result.content[0]?.text || ''
              }
            ]
          }
        };
      }

      case 'ping': {
        return {
          jsonrpc: '2.0',
          id,
          result: {}
        };
      }

      default: {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Método no implementado: ${method}` }
        };
      }
    }
  }

  /**
   * Start listening on stdio (Standard Input / Output)
   */
  public startStdio(): void {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const req = JSON.parse(trimmed) as MCPRequest;
        const res = await this.handleRequest(req);
        process.stdout.write(JSON.stringify(res) + '\n');
      } catch (err: any) {
        const errResponse: MCPResponse = {
          jsonrpc: '2.0',
          id: 0,
          error: { code: -32700, message: `Parse error: ${err.message}` }
        };
        process.stdout.write(JSON.stringify(errResponse) + '\n');
      }
    });

    console.error(`🚀 [MCP Server] Servidor TrautsLab OS activo en stdio (Vault: ${this.vaultRoot})`);
  }
}
