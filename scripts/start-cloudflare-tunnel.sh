#!/usr/bin/env bash
# ==============================================================================
# TrautsLab OS — Cloudflare Zero Trust Tunnel Launcher (Quick / No Open Ports)
# ==============================================================================

set -e

echo "🔒 [TrautsLab OS] Iniciando túnel seguro con Cloudflare Tunnel (cloudflared)..."

if ! command -v cloudflared &> /dev/null; then
    echo "⚠️ cloudflared no está instalado."
    echo "  Instálalo gratis con: brew install cloudflare/cloudflare/cloudflared"
    echo "  O usa Tailscale con: ./scripts/start-tailscale-serve.sh"
    exit 1
fi

echo "✓ Creando túnel temporal rápido hacia http://localhost:3000..."
cloudflared tunnel --url http://localhost:3000
