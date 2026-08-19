# Guía de Inicio Rápido (QUICK-START) — TrautsLab OS

> **Proyecto:** TrautsLab OS  
> **Versión:** 1.2.0  
> **Estándar Horario:** `PET / UTC-5 - Hora Perú`  
> **Autor:** Jhonny Lorenzo (`jlorenzor`)

---

## ⚡ 1. Arranque Inmediato del Sistema

Para iniciar todos los servicios y abrir la ventana del Cockpit de Escritorio en un solo paso:

```bash
cd /Users/jlorenzor/Documents/TrautsLab-OS
npm run desktop
```

### Puertos y Servicios Activos:
- **Web HUD & Cockpit:** `http://localhost:3000`
- **Voice Server (SSE / Audio / API):** `http://localhost:3030`
- **Telegram Bot Poller:** Conectado a `@TrautsLabBot`
- **Ollama Local LLM:** `http://localhost:11434` (`qwen2.5:3b`)

---

## ⌨️ 2. Atajos de Teclado y Controles

| Atajo | Acción | Descripción |
| :---: | :--- | :--- |
| **`Espacio` / `V`** | **Voice Link 3-Tier** | Abre el modal de escucha por voz con modulación 3D |
| **`1`** | **Modo Cockpit** | Vista principal con Vitals, Esfera 3D y Timeline de Agenda |
| **`2`** | **Modo Daily Intel** | Feed de GitHub Trending y debates destacados de Hacker News |
| **`3`** | **Modo Vault Memory** | Explorador y lector Markdown del Obsidian Vault |
| **`4`** | **Modo Skills & Crons** | Directorio de habilidades deterministas y automatizaciones |
| **`5`** | **Modo Quickstart** | Esta guía de inicio rápido interactiva |
| **`6`** | **Modo Docs** | Catálogo completo de capacidades, Casos de Uso y ADRs |
| **`7`** | **Modo Changelog** | Historial de versiones y notas de release SemVer |
| **`L`** | **Pure Light Mode** | Alterna entre tema oscuro (*Amber Void*) y tema claro |
| **`H`** | **Alto Contraste** | Modo accesible de alto contraste (*WCAG AAA*) |
| **`O`** | **Observabilidad** | Telemetría de hardware GPU Metal y trazas acústicas |
| **`T`** | **Terminal Shell** | Despliega la consola terminal interactiva |
| **`Esc`** | **Cerrar Modales** | Cierra cualquier modal o menú flotante activo |

---

## 🤖 3. Conexión de Agentes de IA vía MCP (Model Context Protocol)

Para que asistentes como **Antigravity IDE**, **Claude Code**, **Cursor** o **Cline** puedan interactuar con tu Vault, calendario y habilidades, añade esta configuración a tu archivo `mcp_config.json`:

```json
{
  "mcpServers": {
    "trautslab-os": {
      "command": "npx",
      "args": [
        "tsx",
        "/Users/jlorenzor/Documents/TrautsLab-OS/packages/mcp-server/src/cli.ts"
      ],
      "env": {
        "VAULT_ROOT": "/Users/jlorenzor/Documents/Obsidian Vault",
        "OLLAMA_ENDPOINT": "http://localhost:11434"
      }
    }
  }
}
```

---

## 📱 4. Conexión Remota y Telegram

- **Telegram Bot:** Envía mensajes de texto o notas de voz a [`@TrautsLabBot`](https://t.me/TrautsLabBot). El sistema transcribe el audio con Whisper Metal y ejecuta la acción en tu Vault.
- **Acceso Remoto Seguro (Móvil):** Abre la PWA en tu smartphone conectado a la red privada de Tailscale (`http://[tu-ip-tailscale]:3000`).
