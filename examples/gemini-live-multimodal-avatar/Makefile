PROJECT_ID ?= $(shell gcloud config get-value project)
REGION ?= us-central1
SERVICE_NAME ?= live-api-demo

.PHONY: help auth deploy seed secrets proxy stop-proxy dev stop-dev test all clean destroy update-env install bootstrap lint format

help:
	@echo "Available commands:"
	@echo "  make bootstrap  - Full lifecycle setup: prompts for secrets, deploys infra, and seeds data"
	@echo "  make auth       - Authenticate gcloud and set ADC with quota project (REQUIRED for first-time or expired sessions)"
	@echo "  make install    - Install all frontend and backend dependencies"
	@echo "  make secrets    - Prompt for and upload API keys to Google Cloud Secret Manager"
	@echo "  make deploy     - Provision infrastructure and deploy application using Terraform"
	@echo "  make destroy    - Destroy all infrastructure managed by Terraform"
	@echo "  make update-env - Update local .env file with generated Terraform resource IDs"
	@echo "  make seed       - Sync local data and trigger Vertex AI Search import job"
	@echo "  make proxy      - Start a local authenticated proxy (in background) to access Cloud Run"
	@echo "  make stop-proxy - Stop the background proxy"
	@echo "  make dev        - Start both frontend and backend locally with hot-reloading"
	@echo "  make stop-dev   - Stop the local development environment"
	@echo "  make test       - Run frontend and backend tests"
	@echo "  make lint       - Run static analysis and linting across the project"
	@echo "  make format     - Format code across the project"
	@echo "  make all        - Run deploy and then seed"

auth:
	@echo "Authenticating gcloud CLI..."
	gcloud auth login
	@echo "Authenticating Application Default Credentials (ADC) for Terraform..."
	gcloud auth application-default login
	@echo "Setting quota project to $(PROJECT_ID)..."
	gcloud auth application-default set-quota-project $(PROJECT_ID)

bootstrap: deploy secrets seed
	@echo "================================================="
	@echo "  Bootstrap Complete!"
	@echo "  Infrastructure is deployed, secrets are set,"
	@echo "  and data has been seeded."
	@echo "================================================="

secrets:
	@echo "================================================="
	@echo "  Securely adding API Keys to Secret Manager"
	@echo "================================================="
	@# Process Gemini Key
	@CURR_G=$$( ( [ -f .env ] && grep '^GEMINI_LIVE_API_KEY=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" ) || echo "" ); \
	if [ -n "$$CURR_G" ]; then \
		read -p "Enter Gemini Live API Key [Found in .env]: " gemini_key; \
		gemini_key=$${gemini_key:-$$CURR_G}; \
	else \
		read -p "Enter your Gemini Live API Key: " gemini_key; \
	fi; \
	if [ -n "$$gemini_key" ]; then \
		echo -n "$$gemini_key" | gcloud secrets versions add GEMINI_LIVE_API_KEY --data-file=- --project=$(PROJECT_ID); \
		echo "Gemini Key added successfully."; \
	else \
		echo "Skipping Gemini Key."; \
	fi
	@# Process HeyGen Key
	@CURR_H=$$( ( [ -f .env ] && grep '^HEYGEN_API_KEY=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" ) || echo "" ); \
	if [ -n "$$CURR_H" ]; then \
		read -p "Enter HeyGen API Key [Found in .env]: " heygen_key; \
		heygen_key=$${heygen_key:-$$CURR_H}; \
	else \
		read -p "Enter your HeyGen API Key: " heygen_key; \
	fi; \
	if [ -n "$$heygen_key" ]; then \
		echo -n "$$heygen_key" | gcloud secrets versions add HEYGEN_API_KEY --data-file=- --project=$(PROJECT_ID); \
		echo "HeyGen Key added successfully."; \
	else \
		echo "Skipping HeyGen Key."; \
	fi
	@echo "================================================="
	@echo "  Applying secrets to Cloud Run..."
	@echo "================================================="
	@if gcloud run services describe $(SERVICE_NAME) --region=$(REGION) --project=$(PROJECT_ID) >/dev/null 2>&1; then \
		echo "Restarting Cloud Run service to pick up new keys..."; \
		gcloud run services update $(SERVICE_NAME) --region=$(REGION) --project=$(PROJECT_ID) --update-env-vars=SECRET_REFRESH=$$(date +%s); \
	else \
		echo "Cloud Run service not found (or not deployed yet). Run 'make deploy' to finish setup."; \
	fi

deploy: test
	@echo "Running Terraform init and apply..."
	cd infra && terraform init
	cd infra && terraform apply
	@$(MAKE) update-env

destroy:
	@echo "================================================="
	@echo "  Destroying Infrastructure"
	@echo "================================================="
	@echo "Running Terraform destroy..."
	cd infra && terraform destroy

update-env:
	@echo "Updating .env with latest Terraform outputs..."
	@if [ ! -f .env ]; then \
		echo "Creating .env from .env.example..."; \
		cp .env.example .env; \
	fi
	@sed -i.bak -e "s/^VERTEX_PROJECT_ID=.*/VERTEX_PROJECT_ID=$(PROJECT_ID)/" .env
	@sed -i.bak -e "s/^VERTEX_LOCATION=.*/VERTEX_LOCATION=$(REGION)/" .env
	@DS_ID=$$(cd infra && terraform output -raw vertex_data_store_id) && \
	 sed -i.bak -e "s/^VERTEX_DATA_STORE_ID=.*/VERTEX_DATA_STORE_ID=$$DS_ID/" .env
	@ENG_ID=$$(cd infra && terraform output -raw vertex_engine_id) && \
	 sed -i.bak -e "s/^VERTEX_ENGINE_ID=.*/VERTEX_ENGINE_ID=$$ENG_ID/" .env
	@rm -f .env.bak
	@echo "✅ .env updated successfully with dynamic resource IDs."

seed:
	@echo "Running data seeding scripts..."
	@echo "Seeding Vertex AI Search Data Store..."
	./scripts/seed_data.sh
	@echo "Seeding Firestore Base Scenarios..."
	@set -a; [ -f .env ] && . ./.env; cd backend && go run ../scripts/seed_firestore.go
proxy:
	@echo "Resolving deployed service name from Terraform..."
	$(eval DYNAMIC_SERVICE := $(shell cd infra && terraform output -raw cloud_run_service_name 2>/dev/null || echo $(SERVICE_NAME)))
	@echo "Stopping any existing proxy processes..."
	@-pkill -f 'gcloud run services proxy $(DYNAMIC_SERVICE)' || true
	@echo "Starting authenticated proxy in background for service: $(DYNAMIC_SERVICE)..."
	@nohup gcloud run services proxy $(DYNAMIC_SERVICE) --port=8081 --region=$(REGION) --project=$(PROJECT_ID) > .proxy.log 2>&1 &
	@echo "Waiting for proxy to start..."
	@sleep 3
	@cat .proxy.log
	@echo ""
	@echo "✅ Proxy is running in the background."
	@echo "🌐 Access the app at: http://localhost:8081"
	@echo "📄 Logs available in .proxy.log"
	@echo "🛑 To stop the proxy later, run: make stop-proxy"

dev:
	@echo "Starting local development environment..."
	@if [ ! -f .env ]; then \
		echo "Creating .env from .env.example. Please update your API keys!"; \
		cp .env.example .env; \
	fi
	@# Run both processes concurrently
	@(trap 'kill 0' SIGINT; \
	  (cd frontend && npm run dev) & \
	  (set -a; [ -f .env ] && . ./.env; cd backend && go run github.com/air-verse/air@latest -c .air.toml))

test:
	@echo "Running backend tests..."
	cd backend && make test
	@echo "Running frontend tests and compilation checks..."
	cd frontend && npm run typecheck && npm run test

lint:
	@echo "Linting backend..."
	cd backend && go vet ./...
	@echo "Linting frontend..."
	cd frontend && npm run lint

format:
	@echo "Formatting backend..."
	cd backend && make fmt
	@echo "Formatting frontend..."
	cd frontend && npx eslint . --fix

all: deploy seed

install:
	@echo "Installing backend dependencies..."
	cd backend && go mod tidy
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

clean:
	@echo "Cleaning backend artifacts..."
	cd backend && make clean

stop-proxy:
	$(eval DYNAMIC_SERVICE := $(shell cd infra && terraform output -raw cloud_run_service_name 2>/dev/null || echo $(SERVICE_NAME)))
	@echo "Stopping any existing proxy processes for service: $(DYNAMIC_SERVICE)..."
	@-pkill -f 'gcloud run services proxy $(DYNAMIC_SERVICE)' || true
	@echo "Proxy stopped."
stop-dev:
	@echo "Stopping local development servers gracefully..."
	@-lsof -t -i:8080 | xargs -r kill -TERM 2>/dev/null || true
	@-lsof -t -i:5173 | xargs -r kill -TERM 2>/dev/null || true
	@sleep 2
	@-lsof -t -i:8080 | xargs -r kill -9 2>/dev/null || true
	@-lsof -t -i:5173 | xargs -r kill -9 2>/dev/null || true
	@echo "Development servers stopped."