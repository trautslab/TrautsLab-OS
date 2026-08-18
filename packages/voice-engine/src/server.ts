import http from 'node:http';
import { VoicePipeline } from './pipeline.js';

export interface VoiceServerConfig {
  port?: number;
  vaultRoot: string;
}

const sseClients = new Set<http.ServerResponse>();

export function broadcastLiveEvent(eventType: string, payload: any = {}) {
  const msg = `event: ${eventType}\ndata: ${JSON.stringify({ type: eventType, timestamp: new Date().toISOString(), ...payload })}\n\n`;
  for (const client of Array.from(sseClients)) {
    try {
      client.write(msg);
    } catch {
      sseClients.delete(client);
    }
  }
}

export class VoiceServer {
  private port: number;
  private vaultRoot: string;
  private pipeline: VoicePipeline;
  private server: http.Server | null = null;

  constructor(config: VoiceServerConfig) {
    this.port = config.port || 3030;
    this.vaultRoot = config.vaultRoot;
    this.pipeline = new VoicePipeline({ vaultRoot: config.vaultRoot });
  }

  start(): Promise<number> {
    return new Promise((resolve) => {
      this.server = http.createServer(async (req, res) => {
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

        if (url.pathname === '/api/events/live' && req.method === 'GET') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          });
          res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Event Stream Activo' })}\n\n`);
          sseClients.add(res);

          req.on('close', () => {
            sseClients.delete(res);
          });
          return;
        }

        if (url.pathname === '/api/voice/health' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', engine: 'TrautsLab Voice Engine', port: this.port }));
          return;
        }

        if (url.pathname === '/api/observability/traces' && req.method === 'GET') {
          try {
            const fsPromises = await import('node:fs/promises');
            const path = await import('node:path');
            const cachePath = path.join(this.vaultRoot, 'OUTPUT', 'cache', 'audio-observability.json');
            let data = { recent_traces: [] };
            try {
              const content = await fsPromises.readFile(cachePath, 'utf-8');
              data = JSON.parse(content);
            } catch {}
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (url.pathname === '/api/observability/health' && req.method === 'GET') {
          try {
            const fs = await import('node:fs');
            const whisperPath = '/opt/homebrew/bin/whisper-cli';
            const ffmpegPath = '/opt/homebrew/bin/ffmpeg';
            const modelPath = '/Users/jlorenzor/Documents/TrautsLab-OS/packages/voice-engine/models/ggml-base.bin';

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              whisperInstalled: fs.existsSync(whisperPath),
              whisperPath: fs.existsSync(whisperPath) ? whisperPath : 'NOT_FOUND',
              ffmpegInstalled: fs.existsSync(ffmpegPath),
              modelLoaded: fs.existsSync(modelPath),
              modelSizeMb: fs.existsSync(modelPath) ? Math.round(fs.statSync(modelPath).size / (1024 * 1024)) : 0,
              hardwareAcceleration: 'Metal (Apple GPU)'
            }));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (url.pathname === '/api/observability/logs' && req.method === 'GET') {
          try {
            const component = url.searchParams.get('component') || undefined;
            const limit = parseInt(url.searchParams.get('limit') || '100', 10);
            const { globalSessionManager } = await import('./session-manager.js');
            const logs = globalSessionManager.getLogs(limit, component);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              total_logs: logs.length,
              logs
            }));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (url.pathname === '/api/observability/session' && req.method === 'GET') {
          try {
            const { globalSessionManager } = await import('./session-manager.js');
            const session = globalSessionManager.getSession();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(session));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (url.pathname === '/api/observability/logs/clear' && req.method === 'POST') {
          try {
            const { globalSessionManager } = await import('./session-manager.js');
            globalSessionManager.clearLogs();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Logs limpiados con éxito.' }));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (url.pathname === '/api/telegram/status' && req.method === 'GET') {
          try {
            const { getTelegramConfig } = await import('@trautslab/telegram-bridge');
            const cfg = getTelegramConfig();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              configured: Boolean(cfg.botToken && cfg.chatId),
              botTokenSet: Boolean(cfg.botToken),
              chatIdSet: Boolean(cfg.chatId)
            }));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (url.pathname === '/api/telegram/config' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const fsPromises = await import('node:fs/promises');
              const path = await import('node:path');
              const envPath = path.resolve(this.vaultRoot, '../.env');

              const botToken = payload.botToken?.trim() || '';
              const chatId = payload.chatId?.trim() || '';

              process.env.TELEGRAM_BOT_TOKEN = botToken;
              process.env.TELEGRAM_CHAT_ID = chatId;
              process.env.TELEGRAM_ALLOWED_USER_ID = chatId;

              const envContent = `# TrautsLab OS — Environment Configuration\nTELEGRAM_BOT_TOKEN="${botToken}"\nTELEGRAM_CHAT_ID="${chatId}"\nTELEGRAM_ALLOWED_USER_ID="${chatId}"\nOLLAMA_ENDPOINT="http://localhost:11434"\nOLLAMA_MODEL="qwen2.5:7b"\nOBSIDIAN_VAULT_ROOT="${this.vaultRoot}"\n`;
              await fsPromises.writeFile(envPath, envContent, 'utf-8');

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, message: 'Configuración de Telegram guardada exitosamente.' }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if (url.pathname === '/api/telegram/test' && req.method === 'POST') {
          try {
            const { sendTelegramNotification } = await import('@trautslab/telegram-bridge');
            const result = await sendTelegramNotification(
              '🧪 Prueba de Conexión TrautsLab OS',
              '¡Hola Jhonny! Las notificaciones automáticas de TrautsLab OS están enlazadas y funcionando correctamente.'
            );
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (url.pathname === '/api/voice/query' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body);
              const queryText = payload.query || payload.transcription || '';
              const response = await this.pipeline.processQuery({ transcription: queryText });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                input: response.inputTranscription,
                tier: response.tier,
                target: response.target,
                responsePlainText: response.responsePlainText,
                responsePhoneticTts: response.responsePhoneticTts,
                latencies: response.latencies,
                metadata: response.metadata
              }));
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: msg }));
            }
          });
          return;
        }

        if (url.pathname === '/api/vault/agenda' && req.method === 'GET') {
          try {
            const fsPromises = await import('node:fs/promises');
            const path = await import('node:path');
            const outputDir = path.join(this.vaultRoot, 'OUTPUT');
            let files: string[] = [];
            try {
              files = await fsPromises.readdir(outputDir);
            } catch {}

            const agendaFiles = files.filter(f => f.startsWith('daily-agenda-') && f.endsWith('.md')).sort();
            const allEvents: Array<{ date: string; time: string; title: string; priority: string; status: string }> = [];

            for (const file of agendaFiles) {
              const dateMatch = file.match(/daily-agenda-(\d{4}-\d{2}-\d{2})\.md/);
              const dateStr = dateMatch ? dateMatch[1] : '2026-08-17';
              const filePath = path.join(outputDir, file);
              const content = await fsPromises.readFile(filePath, 'utf-8');

              let inActiveCronograma = false;
              const lines = content.split('\n');
              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.includes('## 🕒 Cronograma del Día') || trimmed.includes('| Hora | Actividad')) {
                  inActiveCronograma = true;
                  continue;
                }
                if (inActiveCronograma && (trimmed.startsWith('## ') || trimmed.startsWith('---') && !trimmed.startsWith('| ---'))) {
                  if (trimmed.includes('## 📦') || trimmed.includes('## 🎯') || trimmed.startsWith('---')) {
                    inActiveCronograma = false;
                  }
                }

                if (inActiveCronograma && trimmed.startsWith('|') && !trimmed.includes('Actividad') && !trimmed.includes(':---') && !trimmed.includes('Hora')) {
                  if (trimmed.includes('ARCHIVADO') || trimmed.includes('~~')) continue;

                  const cols = trimmed.split('|').map(c => c.trim()).filter(Boolean);
                  if (cols.length >= 2) {
                    const rawTime = cols[0].replace(/[`*]/g, '').trim();
                    const rawTitle = cols[1].replace(/[`*~]/g, '').trim();
                    const rawPri = cols[3] ? cols[3].replace(/[`*]/g, '').trim() : 'NORMAL';
                    const rawStatus = cols[4] ? cols[4].replace(/[`*]/g, '').trim() : '🟡 Programado';
                    if (rawTime && rawTitle) {
                      allEvents.push({
                        date: dateStr,
                        time: rawTime,
                        title: rawTitle,
                        priority: rawPri,
                        status: rawStatus
                      });
                    }
                  }
                }
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              vault: this.vaultRoot,
              totalEvents: allEvents.length,
              events: allEvents
            }));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        if (url.pathname === '/api/vault/agenda/archive' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const { CalendarArchiveEventSkill } = await import('@trautslab/skills-engine');
              const archiveSkill = new CalendarArchiveEventSkill();
              const result = await archiveSkill.execute({
                vaultRoot: this.vaultRoot,
                timestamp: new Date(),
                args: {
                  title: payload.title,
                  date: payload.date,
                  archiveAll: payload.archiveAll === true
                }
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if (url.pathname === '/api/vault/agenda/edit' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const payload = JSON.parse(body || '{}');
              const { oldTitle, newTitle, date, newTime } = payload;
              const fsPromises = await import('node:fs/promises');
              const path = await import('node:path');

              const candidateVaults = [
                this.vaultRoot,
                '/Users/jlorenzor/Documents/Obsidian Vault',
                path.resolve(process.cwd(), 'vault')
              ];

              let edited = false;
              for (const vPath of Array.from(new Set(candidateVaults))) {
                const targetDate = date || new Date().toISOString().split('T')[0];
                const agendaFile = path.join(vPath, 'OUTPUT', `daily-agenda-${targetDate}.md`);
                try {
                  const content = await fsPromises.readFile(agendaFile, 'utf-8');
                  const lines = content.split('\n');
                  const updatedLines = lines.map(line => {
                    if (line.startsWith('|') && (line.toLowerCase().includes(oldTitle.toLowerCase()) || (oldTitle && line.includes(oldTitle)))) {
                      edited = true;
                      const cols = line.split('|').map(c => c.trim());
                      const timeCol = newTime ? `\`${newTime}\`` : (cols[1] || '`09:00 AM`');
                      const titleCol = newTitle ? `**${newTitle}**` : (cols[2] || `**${oldTitle}**`);
                      const locCol = cols[3] || 'N/A';
                      const priCol = cols[4] || '`HIGH`';
                      const statusCol = cols[5] || '🟡 Programado';
                      return `| ${timeCol} | ${titleCol} | ${locCol} | ${priCol} | ${statusCol} |`;
                    }
                    return line;
                  });

                  if (edited) {
                    await fsPromises.writeFile(agendaFile, updatedLines.join('\n'), 'utf-8');
                  }
                } catch {}

                // Update Tier 2 Cache if today
                const todayStr = new Date().toISOString().split('T')[0];
                if (targetDate === todayStr) {
                  const cacheFile = path.join(vPath, 'OUTPUT', 'cache', 'today-agenda.json');
                  try {
                    const cacheRaw = await fsPromises.readFile(cacheFile, 'utf-8');
                    const cacheJson = JSON.parse(cacheRaw);
                    if (cacheJson?.data?.events) {
                      cacheJson.data.events = cacheJson.data.events.map((e: any) => {
                        if (e.title.toLowerCase().includes(oldTitle.toLowerCase())) {
                          return {
                            ...e,
                            title: newTitle || e.title,
                            time: newTime || e.time
                          };
                        }
                        return e;
                      });
                      cacheJson.quick_summary_tts = `Tu evento '${newTitle || oldTitle}' ha sido actualizado exitosamente.`;
                      await fsPromises.writeFile(cacheFile, JSON.stringify(cacheJson, null, 2), 'utf-8');
                    }
                  } catch {}
                }
              }

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: edited,
                message: edited ? `Compromiso actualizado a '${newTitle}'.` : `No se encontró el compromiso '${oldTitle}' para editar.`
              }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        if (url.pathname === '/api/vault/agenda/clean' && req.method === 'POST') {
          try {
            const fsPromises = await import('node:fs/promises');
            const path = await import('node:path');
            const outputDir = path.join(this.vaultRoot, 'OUTPUT');
            const todayStr = new Date().toISOString().split('T')[0];

            // Clean today's markdown
            const todayMd = path.join(outputDir, `daily-agenda-${todayStr}.md`);
            const cleanContent = `---
title: "Agenda y Compromisos Diarios: ${todayStr}"
domain: "productivity"
created_at: "${todayStr}"
updated_at: "${todayStr}"
tags: ["agenda", "calendar", "daily-brief", "tasks"]
summary: "Agenda diaria limpia para Jhonny Lorenzo."
---

# Agenda y Compromisos Diarios — ${todayStr}

> **Estado:** Listo para nuevos eventos y compromisos  
> **Propietario:** Jhonny Lorenzo  

---

## 🕒 Cronograma del Día

| Hora | Actividad / Compromiso | Ubicación | Prioridad | Estado |
| :--- | :--- | :--- | :--- | :--- |

---

## 🎯 Notas y Foco del Día
- Sin actividades agendadas. Listo para programar desde cero.
`;
            await fsPromises.writeFile(todayMd, cleanContent, 'utf-8');

            // Reset cache
            const cacheFile = path.join(outputDir, 'cache', 'today-agenda.json');
            try {
              await fsPromises.writeFile(cacheFile, JSON.stringify({
                schema_version: '1.0',
                category: 'daily_agenda',
                generated_at: new Date().toISOString(),
                expires_at: `${todayStr}T23:59:59Z`,
                quick_summary_tts: 'Tu agenda está limpia y lista para registrar nuevos compromisos.',
                data: { eventsCount: 0, events: [] }
              }, null, 2), 'utf-8');
            } catch {}

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Todas las actividades han sido limpiadas exitosamente.' }));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
      });

      this.server.listen(this.port, () => {
        console.log(`\n🎙️ [VoiceServer] Servidor de voz de TrautsLab OS escuchando en http://localhost:${this.port}`);
        resolve(this.port);
      });
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      console.log(`[VoiceServer] Servidor detenido.`);
    }
  }
}
