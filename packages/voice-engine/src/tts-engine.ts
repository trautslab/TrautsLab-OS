import { TTSEngine } from './types.js';

export interface TTSConfig {
  modelName?: string;
  defaultVoice?: string;
  endpointUrl?: string;
}

export class KokoroTTSEngine implements TTSEngine {
  private modelName: string;
  private defaultVoice: string;
  private endpointUrl: string;

  constructor(config: TTSConfig = {}) {
    this.modelName = config.modelName || 'hexgrad/kokoro-82m';
    this.defaultVoice = config.defaultVoice || 'es_f_locutora';
    this.endpointUrl = config.endpointUrl || 'http://localhost:8880/v1/audio/speech';
  }

  async synthesize(text: string, voice?: string): Promise<{ audioBuffer: Buffer; latencyMs: number }> {
    const start = Date.now();
    const selectedVoice = voice || this.defaultVoice;

    try {
      // Attempt connection to local Kokoro TTS ONNX/Python microservice
      const res = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          input: text,
          voice: selectedVoice,
          response_format: 'wav'
        })
      });

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        return {
          audioBuffer: Buffer.from(arrayBuffer),
          latencyMs: Date.now() - start
        };
      }
    } catch {
      // Local daemon fallback / simulated lightweight WAV header
    }

    // Generate lightweight valid PCM WAV header placeholder for simulation
    const simulatedBuffer = Buffer.alloc(44);
    simulatedBuffer.write('RIFF', 0);
    simulatedBuffer.writeUInt32LE(36, 4);
    simulatedBuffer.write('WAVEfmt ', 8);
    simulatedBuffer.writeUInt32LE(16, 16);
    simulatedBuffer.writeUInt16LE(1, 20); // PCM
    simulatedBuffer.writeUInt16LE(1, 22); // Mono
    simulatedBuffer.writeUInt32LE(24000, 24); // 24kHz
    simulatedBuffer.writeUInt32LE(48000, 28);
    simulatedBuffer.writeUInt16LE(2, 32);
    simulatedBuffer.writeUInt16LE(16, 34);
    simulatedBuffer.write('data', 36);
    simulatedBuffer.writeUInt32LE(0, 40);

    return {
      audioBuffer: simulatedBuffer,
      latencyMs: Date.now() - start
    };
  }
}
