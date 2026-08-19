/**
 * TrautsLab OS — Bidirectional Channel Router & Traffic Monitor
 * Ensures every incoming request is acknowledged and responded to via its originating channel,
 * while maintaining a live telemetry log for the HUD.
 */

import { sendTelegramNotification } from '@trautslab/telegram-bridge';

export type ChannelType = 'TELEGRAM' | 'VOICE_HUD' | 'MCP_CLIENT' | 'DESKTOP_APP' | 'SLACK_WEBHOOK' | 'MACOS_NOTIFICATION';

export interface ChannelTrafficEntry {
  id: string;
  timestamp: string;
  channel: ChannelType;
  userQuery: string;
  responseText: string;
  providerUsed: string;
  durationMs: number;
  status: 'SUCCESS' | 'ERROR' | 'PENDING';
}

export class ChannelDispatcher {
  private static trafficHistory: ChannelTrafficEntry[] = [];
  private static maxEntries = 50;
  private static sseBroadcastFn?: (event: string, data: any) => void;

  public static setSSEBroadcaster(fn: (event: string, data: any) => void) {
    this.sseBroadcastFn = fn;
  }

  public static getTrafficHistory(): ChannelTrafficEntry[] {
    return [...this.trafficHistory];
  }

  public static async dispatchResponse(
    channel: ChannelType,
    userQuery: string,
    responseText: string,
    options?: {
      providerUsed?: string;
      durationMs?: number;
      chatId?: number | string;
    }
  ): Promise<void> {
    const entry: ChannelTrafficEntry = {
      id: `traffic-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      channel,
      userQuery,
      responseText: responseText.slice(0, 300),
      providerUsed: options?.providerUsed || process.env.LLM_PROVIDER || 'ollama',
      durationMs: options?.durationMs || 0,
      status: 'SUCCESS'
    };

    this.trafficHistory.unshift(entry);
    if (this.trafficHistory.length > this.maxEntries) {
      this.trafficHistory.pop();
    }

    // 1. Symmetric Dispatch to the originating channel
    switch (channel) {
      case 'TELEGRAM': {
        try {
          await sendTelegramNotification(
            '🤖 Respuesta TrautsLab OS',
            responseText
          );
        } catch (err: any) {
          console.warn('[ChannelDispatcher] Error al responder a Telegram:', err.message);
        }
        break;
      }
      case 'VOICE_HUD':
      case 'DESKTOP_APP':
      case 'MCP_CLIENT':
      default:
        // Already returned directly in HTTP/JSON-RPC response
        break;
    }

    // 2. Broadcast live event to HUD via Server-Sent Events
    if (this.sseBroadcastFn) {
      this.sseBroadcastFn('CHANNEL_TRAFFIC', entry);
    }
  }
}
