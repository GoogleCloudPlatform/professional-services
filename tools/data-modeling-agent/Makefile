ROOT_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

TESTPATH := $(ROOT_DIR)/tests/

.PHONY: install
install: ## Install virtual environment dependencies
	@echo "🚀 Installing dependencies using uv"
	@uv pip install -r requirements.txt

.PHONY: check
check: ## Run static code analysis and linting
	@echo "🚀 Linting code: Running ruff"
	@uvx ruff check --fix
	@echo "🚀 Static type checking: Running mypy"
	@uvx mypy src

.PHONY: test
test: ## Run tests
	@echo "🚀 Testing code: Running pytest"
	@uv run python -m pytest tests/unit/

.PHONY: web
web: ## Run the ADK web demo server
	@uv run adk web --reload src/agents/

.PHONY: api_server
api_server: ## Run the ADK FastAPI server
	@uv run adk api_server src/agents/

.PHONY: help
help:
	@uv run python -c "import re; \
	[[print(f'\033[36m{m[0]:<20}\033[0m {m[1]}') for m in re.findall(r'^([a-zA-Z_-]+):.*?## (.*)$$', open(makefile).read(), re.M)] for makefile in ('$(MAKEFILE_LIST)').strip().split()]"

.DEFAULT_GOAL := help
