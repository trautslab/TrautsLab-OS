import http from 'node:http';
import { VoicePipeline } from './pipeline.js';

export interface VoiceServerConfig {
  port?: number;
  vaultRoot: string;
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

        if (url.pathname === '/api/voice/health' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'ok', engine: 'TrautsLab Voice Engine', port: this.port }));
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
