/**
 * icepanel-mcp/src/icepanel-client.js
 * JavaScript ES Module implementation of IcePanelClient
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class IcePanelClient {
  constructor() {
    this.apiKey = process.env.ICEPANEL_API_KEY;
    this.landscapeId = process.env.ICEPANEL_LANDSCAPE_ID;
    this.landscapeFile = path.resolve(__dirname, '../../artifacts/icepanel-landscape-c4.json');
    this.loadState();
  }

  loadState() {
    if (fs.existsSync(this.landscapeFile)) {
      try {
        this.state = JSON.parse(fs.readFileSync(this.landscapeFile, 'utf-8'));
      } catch {
        this.state = this.getInitialState();
      }
    } else {
      this.state = this.getInitialState();
    }
  }

  getInitialState() {
    return {
      version: '1.0.0',
      landscape: {
        name: 'Retail Core Banking & Transactional Rails (BIAN Architecture)',
        description: 'Squad Cuentas & Rieles Transaccionales',
        organization: 'TrautsLab OS'
      },
      systems: [],
      apps: [],
      stores: [],
      connections: [],
      flows: [],
      tags: []
    };
  }

  saveState() {
    const dir = path.dirname(this.landscapeFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.landscapeFile, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  async createDomain(params) {
    const existingIdx = this.state.systems.findIndex((s) => s.id === params.id || s.name === params.name);
    const domainObj = {
      id: params.id,
      name: params.name,
      description: params.description,
      bianDomainId: params.bianDomainId || 'SD-CORE',
      controlRecord: params.controlRecord || 'Generic Control Record',
      tags: ['tag-bian']
    };

    if (existingIdx >= 0) {
      this.state.systems[existingIdx] = domainObj;
    } else {
      this.state.systems.push(domainObj);
    }

    this.saveState();
    return { success: true, message: `Domain '${params.name}' registered in IcePanel landscape`, domain: domainObj };
  }

  async createComponent(params) {
    const existingIdx = this.state.apps.findIndex((a) => a.id === params.id || a.name === params.name);
    const componentObj = {
      id: params.id,
      systemId: params.systemId,
      name: params.name,
      archetype: params.archetype,
      description: params.description,
      technology: params.technology,
      awsService: params.awsService,
      tags: ['tag-aws', `tag-${params.archetype.toLowerCase().replace(/\s+/g, '-')}`]
    };

    if (existingIdx >= 0) {
      this.state.apps[existingIdx] = componentObj;
    } else {
      this.state.apps.push(componentObj);
    }

    this.saveState();
    return { success: true, message: `Component '${params.name}' [${params.archetype}] registered in IcePanel`, component: componentObj };
  }

  async createConnection(params) {
    const existingIdx = this.state.connections.findIndex((c) => c.id === params.id);
    const connObj = {
      id: params.id,
      from: params.from,
      to: params.to,
      protocol: params.protocol,
      description: params.description
    };

    if (existingIdx >= 0) {
      this.state.connections[existingIdx] = connObj;
    } else {
      this.state.connections.push(connObj);
    }

    this.saveState();
    return { success: true, message: `Connection '${params.from}' -> '${params.to}' created`, connection: connObj };
  }

  async createFlow(params) {
    const existingIdx = this.state.flows.findIndex((f) => f.id === params.id);
    const flowObj = {
      id: params.id,
      name: params.name,
      description: params.description,
      primaryDomain: params.primaryDomain,
      steps: params.steps
    };

    if (existingIdx >= 0) {
      this.state.flows[existingIdx] = flowObj;
    } else {
      this.state.flows.push(flowObj);
    }

    this.saveState();
    return { success: true, message: `Flow '${params.id} (${params.name})' registered with ${params.steps.length} steps`, flow: flowObj };
  }

  async exportLandscape() {
    this.saveState();
    return {
      success: true,
      landscapeFile: this.landscapeFile,
      totalSystems: this.state.systems.length,
      totalApps: this.state.apps.length,
      totalStores: this.state.stores.length,
      totalConnections: this.state.connections.length,
      totalFlows: this.state.flows.length,
      model: this.state
    };
  }

  async syncTerraform(resources) {
    let syncedCount = 0;
    for (const res of resources) {
      const appId = `app-${res.name}`;
      const systemId = `sys-${res.domain.toLowerCase().replace(/\s+/g, '-')}`;
      await this.createComponent({
        id: appId,
        systemId,
        name: res.name,
        archetype: res.archetype,
        description: `Provisioned via Terraform in Floci: ${res.arn || res.name}`,
        technology: res.type,
        awsService: res.type
      });
      syncedCount++;
    }
    return { success: true, syncedCount, message: `Synced ${syncedCount} Terraform infrastructure resources into IcePanel` };
  }
}

