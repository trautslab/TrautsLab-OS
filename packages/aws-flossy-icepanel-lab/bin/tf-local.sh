#!/usr/bin/env bash
set -euo pipefail

# bin/tf-local.sh - Transparent Terraform runner (Local binary or Docker container)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TF_DIR="$PROJECT_ROOT/terraform"

echo "🔧 [Terraform Runner] Working directory: $TF_DIR"

if command -v terraform &>/dev/null; then
  echo "✓ Using host terraform binary ($(terraform version | head -n 1))"
  cd "$TF_DIR"
  terraform "$@"
elif command -v tofu &>/dev/null; then
  echo "✓ Using host OpenTofu binary ($(tofu version | head -n 1))"
  cd "$TF_DIR"
  tofu "$@"
else
  echo "ℹ️ Neither terraform nor tofu found on host. Falling back to Docker container 'hashicorp/terraform:latest'..."
  DOCKER_VAR_FLAG=()
  if [[ "$OSTYPE" == "darwin"* ]]; then
    DOCKER_VAR_FLAG=("-var" "floci_endpoint=http://host.docker.internal:4566")
  fi

  docker run --rm -i \
    -v "$TF_DIR:/workspace" \
    -w /workspace \
    -e AWS_ACCESS_KEY_ID=mock_access_key \
    -e AWS_SECRET_ACCESS_KEY=mock_secret_key \
    -e AWS_DEFAULT_REGION=us-east-1 \
    hashicorp/terraform:latest "$@" "${DOCKER_VAR_FLAG[@]}"
fi

