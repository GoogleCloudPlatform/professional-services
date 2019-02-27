.EXPORT_ALL_VARIABLES:
PIPENV_VENV_IN_PROJECT = 1
PIPENV_IGNORE_VIRTUALENVS = 1

.PHONY: help
help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.installed: Pipfile Pipfile.lock
	@echo "==> Pipfile(.lock) is newer than .installed, (re)installing"
	@pipenv install --dev
	@echo "This file is used by 'make' for keeping track of last install time. If Pipfile or Pipfile.lock are newer then this file (.installed) then all 'make *' commands that depend on '.installed' know they need to run pipenv install first." \
		> .installed

.PHONY: clean
clean: ## Removes build and test artifacts
	@echo "==> Removing build and test artifacts"
	@rm -rf *.egg *egg-info .cache .coverage .tox build bin include dist htmlcov lib .pytest_cache .venv .installed
	@find . -name '*.pyc' -exec rm -f {} +
	@find . -name '*.pyo' -exec rm -f {} +
	@find . -name '*~' -exec rm -f {} +
	@find . -name '__pycache__' -exec rm -rf {} +

.PHONY: fmt
fmt: .installed ## Formats all files with black
	@echo "==> Formatting with Black"
	@pipenv run black dagfactory

.PHONY: test
test: .installed ## Runs unit tests
	@pipenv run pytest --cov=dagfactory tests -p no:warnings --verbose --color=yes

.PHONY: docker-build
docker-build:
	@echo "==> Building docker image for local testing"
	@docker build -t auto-compose:latest .

.PHONY: docker-push
docker-push:
	@echo "==> Push docker image to GCR"
	@docker tag auto-compose:latest gcr.io/pso-suchit/auto-compose
	@docker push gcr.io/pso-suchit/auto-compose

.PHONY: docker-run
docker-run:
	@echo "==> run the docker file and deploy your dag's to cloud composer"
	chmod +x ./scripts/bootstrap.sh
	./scripts/bootstrap.sh

.PHONY: docker-stop
docker-stop: ## Stop Docker container
	@docker stop dag_factory; docker rm auto-compose