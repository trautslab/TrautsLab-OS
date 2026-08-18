/**
 * TrautsLab OS — Session Manager & End-to-End Observability Ledger
 * Persists full conversation sessions, telemetry logs, and syncs history to Obsidian Vault.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface LogEntry {
  id: string;
  timestamp: string;
  timePeru: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' | 'STT' | 'ROUTER' | 'SKILL' | 'TELEGRAM';
  component: 'voice_engine' | 'telegram_bridge' | 'skills_engine' | 'vault_engine';
  message: string;
  metadata?: Record<string, any>;
}

export interface SessionMessage {
  id: string;
  timestamp: string;
  timePeru: string;
  sourceClient: 'telegram' | 'web_pwa' | 'global_hotkey' | 'cli';
  sender: 'user' | 'assistant' | 'system';
  type: 'text' | 'voice_note' | 'command' | 'skill_result';
  rawInput?: string;
  transcription?: string;
  responsePlainText?: string;
  tier?: string;
  latencyMs?: number;
  metadata?: Record<string, any>;
}

export interface ActiveSession {
  sessionId: string;
  date: string;
  startedAt: string;
  lastActiveAt: string;
  totalInteractions: number;
  messages: SessionMessage[];
}

export class SessionManager {
  private vaultRoot: string;
  private currentSession: ActiveSession;
  private systemLogs: LogEntry[] = [];
  private maxLogs: number = 200;

  constructor(vaultRoot?: string) {
    this.vaultRoot = vaultRoot || process.env.OBSIDIAN_VAULT_ROOT || '/Users/jlorenzor/Documents/Obsidian Vault';
    this.currentSession = this.initSession();
    this.loadPersistedSession();
  }

  private getPeruTime(): string {
    return new Date().toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      hour12: true,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private initSession(): ActiveSession {
    const today = this.getTodayDate();
    return {
      sessionId: `session_${today}_${Math.random().toString(36).substring(7)}`,
      date: today,
      startedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      totalInteractions: 0,
      messages: []
    };
  }

  /**
   * Records a structured system log event
   */
  public log(
    level: LogEntry['level'],
    component: LogEntry['component'],
    message: string,
    metadata?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      timePeru: this.getPeruTime(),
      level,
      component,
      message,
      metadata
    };

    this.systemLogs.unshift(entry);
    if (this.systemLogs.length > this.maxLogs) {
      this.systemLogs.pop();
    }

    console.log(`[${entry.timePeru}] [${level}] [${component}] ${message}`);
    this.persistLogs();
  }

  /**
   * Records an interactive message turn into the active session
   */
  public recordMessage(msg: Omit<SessionMessage, 'id' | 'timestamp' | 'timePeru'>): SessionMessage {
    const fullMsg: SessionMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      timePeru: this.getPeruTime(),
      ...msg
    };

    this.currentSession.messages.push(fullMsg);
    this.currentSession.totalInteractions++;
    this.currentSession.lastActiveAt = new Date().toISOString();

    this.log(
      'INFO',
      msg.sourceClient === 'telegram' ? 'telegram_bridge' : 'voice_engine',
      `Interacción registrada [${msg.sourceClient} • ${msg.type}]: "${msg.rawInput || msg.transcription || ''}" ➔ "${msg.responsePlainText?.slice(0, 60) || ''}..."`,
      { tier: msg.tier, latencyMs: msg.latencyMs }
    );

    this.persistSessionToVault();
    return fullMsg;
  }

  public getSession(): ActiveSession {
    return this.currentSession;
  }

  public getLogs(limit: number = 100, component?: string): LogEntry[] {
    if (!component || component === 'ALL') {
      return this.systemLogs.slice(0, limit);
    }
    return this.systemLogs.filter(l => l.component === component).slice(0, limit);
  }

  public clearLogs(): void {
    this.systemLogs = [];
    this.persistLogs();
  }

  private loadPersistedSession(): void {
    try {
      const today = this.getTodayDate();
      const cacheDir = path.join(this.vaultRoot, 'OUTPUT', 'cache');
      const sessionCachePath = path.join(cacheDir, `active-session-${today}.json`);

      if (fs.existsSync(sessionCachePath)) {
        const content = fs.readFileSync(sessionCachePath, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed && parsed.sessionId) {
          this.currentSession = parsed;
        }
      }
    } catch {}
  }

  private persistLogs(): void {
    try {
      const cacheDir = path.join(this.vaultRoot, 'OUTPUT', 'cache');
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      const logsCachePath = path.join(cacheDir, 'system-logs.json');
      fs.writeFileSync(logsCachePath, JSON.stringify({
        last_updated: new Date().toISOString(),
        total_logs: this.systemLogs.length,
        logs: this.systemLogs
      }, null, 2), 'utf-8');
    } catch {}
  }

  private persistSessionToVault(): void {
    const today = this.getTodayDate();
    const cacheDir = path.join(this.vaultRoot, 'OUTPUT', 'cache');
    const reportsDir = path.join(this.vaultRoot, 'OUTPUT', 'reports');

    try {
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
      if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

      // 1. Save JSON snapshot
      const sessionCachePath = path.join(cacheDir, `active-session-${today}.json`);
      fs.writeFileSync(sessionCachePath, JSON.stringify(this.currentSession, null, 2), 'utf-8');

      // 2. Append Markdown Journal in Obsidian
      const sessionMdPath = path.join(reportsDir, `session-journal-${today}.md`);
      let mdHeader = '';
      if (!fs.existsSync(sessionMdPath)) {
        mdHeader = `---
title: "Registro de Sesión y Conversaciones: ${today}"
domain: "operations"
created_at: "${today}"
updated_at: "${today}"
tags: ["session", "telemetry", "logs", "conversations"]
summary: "Historial continuo de interacciones de voz, comandos y Telegram para Jhonny Lorenzo."
---

# Registro de Sesión y Conversaciones — ${today}

> **Propietario:** Jhonny Lorenzo (jlorenzor)  
> **ID de Sesión:** \`${this.currentSession.sessionId}\`  
> **Estándar Horario:** PET / UTC-5 - Hora Perú  

---

## 📜 Historial de Interacciones

| Hora (PET) | Canal | Tipo | Entrada / Transcripción | Respuesta Generada | Nivel | Latencia |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
`;
      }

      const rows = this.currentSession.messages.map(m => {
        const cleanInput = (m.rawInput || m.transcription || 'N/A').replace(/[|\n]/g, ' ').trim();
        const cleanResponse = (m.responsePlainText || 'N/A').replace(/[|\n]/g, ' ').trim();
        return `| \`${m.timePeru}\` | \`${m.sourceClient}\` | \`${m.type}\` | **${cleanInput}** | ${cleanResponse} | \`${m.tier || 'N/A'}\` | \`${m.latencyMs || 0}ms\` |`;
      }).join('\n');

      if (mdHeader) {
        fs.writeFileSync(sessionMdPath, mdHeader + rows + '\n', 'utf-8');
      } else {
        // Overwrite complete table
        const content = fs.readFileSync(sessionMdPath, 'utf-8');
        const splitIdx = content.indexOf('| Hora (PET) | Canal | Tipo');
        if (splitIdx !== -1) {
          const headerPart = content.substring(0, splitIdx);
          const tableHeader = `| Hora (PET) | Canal | Tipo | Entrada / Transcripción | Respuesta Generada | Nivel | Latencia |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
          fs.writeFileSync(sessionMdPath, headerPart + tableHeader + rows + '\n', 'utf-8');
        }
      }
    } catch (err: any) {
      console.warn('[SessionManager] Warning persisting session:', err.message);
    }
  }
}

// Global Singleton Instance
export const globalSessionManager = new SessionManager();
