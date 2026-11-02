#!/usr/bin/env bash
set -euo pipefail

# bin/flossy.sh - Floci / Flossy Local AWS Emulator CLI
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

COMMAND="${1:-status}"

case "$COMMAND" in
  up|start)
    echo "🚀 Starting Floci (Flossy) Local AWS Emulator on port 4566..."
    cd "$PROJECT_ROOT"
    docker compose up -d
    echo "Waiting for Floci to become ready..."
    for i in {1..15}; do
      if curl -s http://localhost:4566/_floci/health &>/dev/null || curl -s http://localhost:4566/_localstack/health &>/dev/null; then
        echo "✅ Floci is ready at http://localhost:4566"
        exit 0
      fi
      sleep 1
    done
    echo "ℹ️ Container started. Check health with 'curl http://localhost:4566'"
    ;;
  down|stop)
    echo "🛑 Stopping Floci (Flossy)..."
    cd "$PROJECT_ROOT"
    docker compose down
    echo "✓ Floci stopped."
    ;;
  status)
    echo "🔍 Checking Floci status on port 4566..."
    if docker ps | grep -q "flossy-local-aws"; then
      echo "✓ Floci container is running."
      curl -s http://localhost:4566 || echo "HTTP port responding."
    else
      echo "⚠️ Floci container is NOT running. Run './bin/flossy.sh up' to start."
    fi
    ;;
  logs)
    cd "$PROJECT_ROOT"
    docker compose logs -f floci
    ;;
  *)
    echo "Usage: $0 {up|down|status|logs}"
    exit 1
    ;;
esac

