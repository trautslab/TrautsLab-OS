# Configuración y Compilación de la Aplicación Nativa con Tauri v2

> **Paquete:** `packages/desktop-app`  
> **Framework:** Tauri v2 (Rust + WebKit)  
> **Plataformas Objetivo:** macOS (Apple Silicon M1/M2/M3/M4 & Intel), Linux, Windows  
> **Huella de Memoria:** < 15 MB RAM en ejecución

---

## ⚡ 1. Ventajas de Tauri frente a Electron en TrautsLab OS

| Métrica / Característica | Tauri v2 | Electron Clásico |
| :--- | :--- | :--- |
| **Consumo de Memoria RAM** | **~12 - 18 MB** | **> 180 - 250 MB** |
| **Tamaño del Instalador / Binario** | **~10 - 15 MB** | **> 120 - 180 MB** |
| **Motor Web Renderizador** | **WebKit Nativo de macOS (WKWebView)** | Chromium embebido pesado |
| **Rendimiento en Segundo Plano** | **Cero memory leaks, idle < 0.1% CPU** | Alto consumo de CPU y memoria |
| **System Tray en Barra de Menús** | **Nativo en Rust sin parpadeos** | Propenso a congelamientos |
| **Hotkey Global a Nivel de SO** | **Inmediato (`Cmd+Shift+Space`)** | Retraso perceptible de Node.js |

---

## 🛠️ 2. Prerrequisitos de Compilación

Para compilar el binario nativo `.app` o `.dmg` en macOS:

1. **Instalar Rust y Cargo:**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source "$HOME/.cargo/env"
   ```

2. **Instalar dependencias del CLI de Tauri:**
   ```bash
   cd packages/desktop-app
   npm install
   ```

---

## 🚀 3. Comandos de Ejecución y Empaquetado

### Modo Desarrollo con Hot-Reload:
```bash
cd packages/desktop-app
npm run tauri:dev
```

### Compilación y Generación del Paquete de Producción (`.dmg` / `.app`):
```bash
cd packages/desktop-app
npm run tauri:build
```
El instalador generado se ubicará en:
`packages/desktop-app/src-tauri/target/release/bundle/dmg/TrautsLab OS_1.0.0_aarch64.dmg`
