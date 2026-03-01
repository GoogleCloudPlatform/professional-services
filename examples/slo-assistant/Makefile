.PHONY: test clean format lint

test:
	@echo "Running all tests and generating coverage report..."
	@PYTHONPATH=. venv/bin/pytest \
		--cov=app --cov-report=term-missing --cov-report=html \
		tests/

format:
	@echo "Formatting code with black..."
	@venv/bin/black app/ main.py server.py app_ui.py

lint:
	@echo "Linting code with pylint..."
	@venv/bin/pylint app/ main.py server.py app_ui.py

clean:
	@echo "Cleaning up temporary build, test, and Python artifacts..."
	@find . -type d -name "__pycache__" -exec rm -rf {} +
	@rm -rf .pytest_cache .coverage htmlcov/
	@# Clean up temporary git repos created by E2E tests
	@rm -rf /tmp/sample_e2e_repo*