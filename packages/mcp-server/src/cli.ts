#!/usr/bin/env node
/**
 * TrautsLab OS — MCP Server Executable CLI
 */

import fs from 'node:fs';
import path from 'node:path';
import { MCPServer } from './server.js';

const defaultVault = process.env.OBSIDIAN_VAULT_ROOT ||
  (fs.existsSync('/Users/jlorenzor/Documents/Obsidian Vault')
    ? '/Users/jlorenzor/Documents/Obsidian Vault'
    : path.resolve(process.cwd(), 'vault'));

const server = new MCPServer({
  vaultRoot: defaultVault,
  serverName: 'trautslab-os-mcp',
  serverVersion: '1.0.0'
});

server.startStdio();
