import http from 'node:http';
import { VoicePipeline } from './pipeline.js';

export interface VoiceServerConfig {
  port?: number;
  vaultRoot: string;
}

export class VoiceServer {
  private port: number;
  private pipeline: VoicePipeline;
  private server: http.Server | null = null;

  constructor(config: VoiceServerConfig) {
    this.port = config.port || 3030;
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
