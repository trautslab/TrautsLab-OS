#!/usr/bin/env bash
set -euo pipefail

# bin/likec4.sh - LikeC4 Architecture Preview & MCP Manager
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LIKEC4_DIR="$PROJECT_ROOT/likec4/src"

COMMAND="${1:-start}"

case "$COMMAND" in
  start|preview|dev)
    echo "🚀 Starting LikeC4 interactive web canvas on http://localhost:5173..."
    npx -y likec4 start "$LIKEC4_DIR"
    ;;
  build)
    echo "📦 Building LikeC4 static web application into $PROJECT_ROOT/dist/likec4..."
    npx -y likec4 build "$LIKEC4_DIR" -o "$PROJECT_ROOT/dist/likec4"
    ;;
  mcp)
    echo "🤖 Starting official LikeC4 MCP Server over stdio..."
    npx -y likec4 mcp "$LIKEC4_DIR"
    ;;
  check|validate)
    echo "🔍 Validating LikeC4 DSL syntax..."
    npx -y likec4 check "$LIKEC4_DIR"
    ;;
  *)
    echo "Usage: $0 {start|build|mcp|check}"
    exit 1
    ;;
esac

