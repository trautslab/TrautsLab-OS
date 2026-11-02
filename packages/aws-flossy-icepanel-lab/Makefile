# ==============================================================================
# Makefile - AWS Flossy (Floci) Local with IcePanel & BIAN Architecture Lab
# ==============================================================================

.PHONY: help up down status tf-init tf-plan tf-apply tf-destroy ingest mcp-serve mcp-test likec4-start likec4-build likec4-mcp likec4-check all

help:
	@echo "=================================================================="
	@echo "🏛️  AWS Flossy (Floci) Local + IcePanel & LikeC4 BIAN Lab"
	@echo "=================================================================="
	@echo "  make up            - Start Floci (Flossy) local AWS emulator (port 4566)"
	@echo "  make down          - Stop Floci emulator"
	@echo "  make status        - Check Floci emulator health and status"
	@echo "  make tf-init       - Initialize Terraform for local Floci"
	@echo "  make tf-plan       - Plan Terraform provisioning on Floci"
	@echo "  make tf-apply      - Apply Terraform infrastructure on Floci"
	@echo "  make tf-destroy    - Destroy Terraform resources on Floci"
	@echo "  make ingest        - Run Agent LLM ingestion (IcePanel & LikeC4 C4 models)"
	@echo "  make mcp-serve     - Start IcePanel Model Context Protocol (MCP) server"
	@echo "  make mcp-test      - Test IcePanel MCP tools/list and export"
	@echo "  make likec4-start  - Start LikeC4 interactive web canvas (http://localhost:5173)"
	@echo "  make likec4-build  - Build static web application for LikeC4"
	@echo "  make likec4-mcp    - Start official LikeC4 MCP server for AI agents"
	@echo "  make likec4-check  - Validate LikeC4 DSL syntax"
	@echo "  make all           - Run complete laboratory sequence"
	@echo "=================================================================="

up:
	@./bin/flossy.sh up

down:
	@./bin/flossy.sh down

status:
	@./bin/flossy.sh status

tf-init:
	@./bin/tf-local.sh init

tf-plan:
	@./bin/tf-local.sh plan -var-file=local.tfvars

tf-apply:
	@./bin/tf-local.sh apply -auto-approve -var-file=local.tfvars

tf-destroy:
	@./bin/tf-local.sh destroy -auto-approve -var-file=local.tfvars

ingest:
	@node ./agent-engine/index.mjs

mcp-serve:
	@node ./icepanel-mcp/src/server.js

mcp-test:
	@echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node ./icepanel-mcp/src/server.js
	@echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"icepanel_export_landscape","arguments":{}}}' | node ./icepanel-mcp/src/server.js | head -n 30

likec4-start:
	@./bin/likec4.sh start

likec4-build:
	@./bin/likec4.sh build

likec4-mcp:
	@./bin/likec4.sh mcp

likec4-check:
	@./bin/likec4.sh check

demo-collision:
	@node ./bin/test-acg-collision-sim.mjs

all: ingest mcp-test likec4-check demo-collision
	@echo "✅ Laboratory verification completed successfully!"

