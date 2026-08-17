# TrautsLab OS — Guía de Despliegue Móvil y Configuración de Túneles Seguros

> **Documento:** `docs/deployment/mobile-tunnel-setup.md`  
> **Proyecto:** TrautsLab OS  
> **Versión:** `v0.1.0-alpha.7` (Fase 6)  
> **Fecha y Hora:** 2026-08-17 12:26:00 (PET / UTC-5 - Hora Perú)  
> **Autor:** Jhonny Lorenzo ([@jlorenzor](https://github.com/jlorenzor))  

---

## 📱 1. Resumen de la Arquitectura Móvil

Para interactuar con **TrautsLab OS** desde tu smartphone (iOS / Android) mientras estás en la calle con costo **$0/mes**, dispones de dos canales complementarios:

1. **PWA Móvil en el Navegador:** El Command Center visual completo instalado como app nativa en tu pantalla de inicio.
2. **Bot Privado de Telegram (`@trautslab/telegram-bridge`):** Interacción ultra-ligera por texto o notas de voz enviadas sobre la marcha.

---

## 🔒 2. Configuración del Túnel Remoto Seguro (Costo $0)

No es necesario abrir puertos en tu router ni exponer tu IP pública. Recomendamos **Tailscale**:

### Opción A: Tailscale Mesh VPN (Recomendada)

1. **En tu Mac:**
   ```bash
   brew install tailscale
   sudo tailscale up
   ```
2. **En tu Smartphone:**
   - Descarga la app **Tailscale** desde la App Store (iOS) o Google Play (Android).
   - Inicia sesión con la misma cuenta de Google/Apple/GitHub.
3. **Compartir el Dashboard:**
   Ejecuta el script incluido en TrautsLab OS:
   ```bash
   ./scripts/start-tailscale-serve.sh
   ```
4. **Abrir en el Móvil:**
   Entra a la URL de tu máquina (ej. `https://macbook-pro.tu-tailnet.ts.net`) desde Safari o Chrome.

---

### Opción B: Cloudflare Zero Trust Tunnel

1. **Instalar `cloudflared`:**
   ```bash
   brew install cloudflare/cloudflare/cloudflared
   ```
2. **Iniciar túnel rápido:**
   ```bash
   ./scripts/start-cloudflare-tunnel.sh
   ```
3. El terminal te entregará una URL segura `https://random-subdomain.trycloudflare.com` accesible desde cualquier parte del mundo.

---

## 📲 3. Instalación de la PWA en el Smartphone

Una vez abierta la URL en tu móvil:
* **En iPhone (iOS Safari):**
  1. Pulsa el botón **Compartir** (icono de cuadrado con flecha arriba).
  2. Selecciona **"Añadir a la pantalla de inicio"**.
  3. Tendrás el icono de TrautsLab OS en tu pantalla como una app nativa con soporte a pantalla completa y Service Worker.
* **En Android (Google Chrome):**
  1. Pulsa el menú de 3 puntos en la esquina superior derecha.
  2. Selecciona **"Instalar aplicación"** o **"Añadir a la pantalla principal"**.

---

## 🤖 4. Configuración del Bot de Telegram

1. **Crear tu Bot en Telegram:**
   - Habla con `@BotFather` en Telegram y escribe `/newbot`.
   - Copia el `HTTP API Token` generado.
2. **Configurar Variables de Entorno:**
   ```bash
   export TELEGRAM_BOT_TOKEN="tu_token_aqui"
   export TELEGRAM_ALLOWED_USER_ID="tu_id_de_telegram"
   ```
3. **Iniciar el Bridge:**
   ```bash
   cd packages/telegram-bridge
   npm start
   ```
4. Envía notas de voz o comandos (`/intel`, `/agenda`, `/run morning-intel-scan`) directamente desde la app de Telegram en la calle.
