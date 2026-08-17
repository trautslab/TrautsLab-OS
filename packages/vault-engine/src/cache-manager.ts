import fs from 'node:fs/promises';
import path from 'node:path';
import { Tier2CachePayload } from './types.js';

export class Tier2CacheManager {
  private cacheDir: string;

  constructor(vaultRoot: string) {
    this.cacheDir = path.join(path.resolve(vaultRoot), 'OUTPUT', 'cache');
  }

  async ensureCacheDir(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  /**
   * Get a cached snapshot payload by key (e.g., 'today-intel', 'today-agenda')
   */
  async getCache<T = unknown>(key: string): Promise<Tier2CachePayload<T> | null> {
    const filePath = path.join(this.cacheDir, `${key}.json`);
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const payload: Tier2CachePayload<T> = JSON.parse(raw);
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Get fast phonetic snippet directly for Kokoro TTS (<5ms)
   */
  async getTtsSnippet(key: string): Promise<string | null> {
    const payload = await this.getCache(key);
    if (!payload) return null;
    return payload.quick_summary_tts || null;
  }

  /**
   * Set a cached snapshot payload
   */
  async setCache<T = unknown>(key: string, payload: Tier2CachePayload<T>): Promise<string> {
    await this.ensureCacheDir();
    const filePath = path.join(this.cacheDir, `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    return filePath;
  }
}
