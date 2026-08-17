#!/usr/bin/env bash
# ==============================================================================
# TrautsLab OS — Tailscale Serve Launcher (Zero Port Forwarding / Free & Secure)
# ==============================================================================

set -e

echo "🔒 [TrautsLab OS] Iniciando túnel privado seguro con Tailscale..."

# Check if tailscale CLI is installed
if ! command -v tailscale &> /dev/null; then
    echo "⚠️ Tailscale no está instalado en el sistema."
    echo "  Descárgalo gratis en: https://tailscale.com/download"
    echo "  O vía Homebrew: brew install tailscale"
    exit 1
fi

echo "✓ Conectando frontend (puerto 3000) a tu Tailnet privada..."
tailscale serve --bg 3000

echo ""
echo "=============================================================================="
echo "🎉 ¡TrautsLab OS PWA ahora es accesible de forma segura desde tu smartphone!"
echo "Accede desde cualquier lugar en tu tailnet: https://$(tailscale status --json | grep -o '"DNSName":"[^"]*' | head -n 1 | cut -d'"' -f4)"
echo "=============================================================================="
