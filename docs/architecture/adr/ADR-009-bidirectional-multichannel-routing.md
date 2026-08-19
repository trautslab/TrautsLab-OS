# ADR-009: Enrutamiento Simétrico y Monitoreo de Canales Bidireccionales

## Estado
Aceptado

## Contexto
El usuario puede interactuar con TrautsLab OS desde múltiples puntos de entrada: el bot de Telegram, el modal de voz en el Cockpit, la shell de escritorio Tauri, un cliente MCP (como Claude o Antigravity) o mediante webhooks de Slack. Previamente, algunas respuestas se emitían de forma dispersa o no quedaba constancia en la interfaz de usuario sobre por qué canal se recibió y devolvió la respuesta.

## Decisión
Implementar el módulo `ChannelDispatcher` en el motor de voz y servidor de eventos:
1. **Detección de Origen (*Origin Tracking*):** Cada solicitud entrante es etiquetada con su canal emisor (`TELEGRAM`, `VOICE_HUD`, `MCP_CLIENT`, `DESKTOP_APP`, `SLACK_WEBHOOK`, `MACOS_NOTIFICATION`).
2. **Despacho Simétrico:** La respuesta generada por el pipeline o la habilidad se devuelve obligatoriamente por el mismo canal de origen (ej: nota de voz en Telegram recibe respuesta de texto en Telegram; comando de voz en HUD recibe locución Kokoro TTS y actualización de UI).
3. **Monitor de Tráfico en Tiempo Real (*Live Influx Monitor*):** Cada transacción se transmite mediante Server-Sent Events (`CHANNEL_TRAFFIC`) y se visualiza en la vista dedicada `CHANNELS & INTEGRATIONS` del HUD.

## Consecuencias
- **Positivas:**
  - Experiencia de usuario coherente y predecible en todos los dispositivos.
  - Trazabilidad y observabilidad total del tráfico multicanal en la pantalla principal.
- **Negativas:**
  - Requiere credenciales activas en cada canal para completar el ciclo de despacho.
