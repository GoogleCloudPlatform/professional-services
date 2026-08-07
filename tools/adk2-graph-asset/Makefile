# Makefile for adk2-graph-asset
# 
# This Makefile provides common development tasks for the ADK2 Graph Asset tool.
# Usage: make [target]
#
# Available targets:
#   help        - Show this help message
#   install     - Install development dependencies
#   fmt         - Format code with black and isort
#   lint        - Lint code with pylint
#   typecheck   - Type check with mypy
#   test        - Run pytest tests with coverage
#   clean       - Clean build artifacts and cache files

.PHONY: help install fmt lint typecheck test clean

help:
	@echo "ADK2 Graph Asset - Build Targets"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  help         Show this help message"
	@echo "  install      Install development dependencies"
	@echo "  fmt          Format code with black and isort"
	@echo "  lint         Lint code with pylint"
	@echo "  typecheck    Type check with mypy"
	@echo "  test         Run pytest tests with coverage"
	@echo "  clean        Clean build artifacts and cache"
	@echo ""
	@echo "Common workflows:"
	@echo "  make install fmt lint typecheck test  (full validation)"
	@echo "  make test                              (quick test)"
	@echo "  make fmt                               (auto-fix formatting)"

install:
	@echo "Installing development dependencies..."
	pip install -q black==24.1.1 isort==5.13.2
	pip install -q pylint==3.0.3 mypy==1.8.0
	pip install -q pytest==7.4.4 pytest-cov==4.1.0
	pip install -r agent/requirements.txt
	@echo "✓ Dependencies installed"

fmt:
	@echo "Formatting code with black..."
	black agent/ localtest.py main.py tests/
	@echo "✓ Sorting imports with isort..."
	isort agent/ localtest.py main.py tests/
	@echo "✓ Code formatting complete"

lint:
	@echo "Linting code with pylint..."
	@pylint agent/ localtest.py main.py || { echo "⚠ Lint warnings found (see above)"; exit 0; }
	@echo "✓ Lint check complete"

typecheck:
	@echo "Type checking with mypy..."
	@mypy agent/ localtest.py main.py || { echo "⚠ Type check warnings found (see above)"; exit 0; }
	@echo "✓ Type check complete"

test:
	@echo "Running tests with pytest..."
	pytest tests/ -v --cov=agent --cov-report=term-missing
	@echo ""
	@echo "✓ Tests complete"

clean:
	@echo "Cleaning build artifacts..."
	find . -type f -name '*.pyc' -delete
	find . -type d -name '__pycache__' -delete
	find . -type d -name '*.egg-info' -delete
	find . -type d -name '.pytest_cache' -delete -o -name '.mypy_cache' -delete
	rm -rf build/ dist/ .coverage htmlcov/ *.egg-info
	@echo "✓ Clean complete"

.DEFAULT_GOAL := help
