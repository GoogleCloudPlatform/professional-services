SHELL 	:= /usr/bin/env bash

PYTHON = $(VENV_DIR)/bin/python
PIP = $(VENV_DIR)/bin/pip
VENV_DIR = venv
VENV_MARKER = source $(VENV_DIR)/bin/activate

INPUT_VALUES    := $(or $(MONITORING_ALERT_INPUT_VALUES), values.yaml)
OUTPUT_GCLOUD   := $(or $(MONITORING_ALERT_OUTPUT_GCLOUD), samples/gcloud)
OUTPUT_TF       := $(or $(MONITORING_ALERT_OUTPUT_TF), samples/tf)
CONFIG 			:= -f build/config/schema.yaml -f $(INPUT_VALUES) -f build/ytt_lib/

# By default, generating all services 
# For testing, can be set SERVICE := "cloudsql"
# SERVICE := "cloudkms"

CUSTOM_SHA_BASE_DIR := build/custom-sha/
CUSTOM_SHA_DIR := $(CUSTOM_SHA_BASE_DIR)

ifneq ($(strip $(SERVICE)),"")
  CUSTOM_SHA_DIR := $(CUSTOM_SHA_BASE_DIR)$(SERVICE)
endif

TEST_ARGS =
ifneq ($(TEST_CONTROL),)
    TEST_ARGS = -m $(TEST_CONTROL)
endif

YQ := $(shell command -v yq 2> /dev/null)
ifndef YQ
    $(error "yq is not installed or not in PATH. Please install yq: https://github.com/mikefarah/yq/#install")
endif

PROJECT_ID		:= $(shell $(YQ) '.project' ${INPUT_VALUES})
PROJECT_NUMBER 	:= $(shell $(YQ) '.project_number' ${INPUT_VALUES})

.PHONY: install
install: 
	@echo "Creating virtual environment in $(VENV_DIR)..."
	python3 -m venv $(VENV_DIR)
	@echo "Virtual environment created."
	$(VENV_MARKER)
	$(PIP) install -r scripts/requirements.txt
	$(PIP) install -r tests/requirements.txt

.PHONY: install alerts
alerts:
	rm -rf $(OUTPUT_GCLOUD)/log-based-metrics	
	rm -rf $(OUTPUT_GCLOUD)/alerts
	ytt $(CONFIG) -f build/log-based-metrics/  --output-files $(OUTPUT_GCLOUD)/log-based-metrics
	ytt $(CONFIG) -f build/alerts/  --output-files $(OUTPUT_GCLOUD)/alerts
	prettier $(OUTPUT_GCLOUD) -c .prettierrc --write --prose-wrap always --print-width 120

.PHONY: alerts-tf
alerts-tf: alerts
	$(PYTHON) scripts/cvt-tf-alerts.py $(OUTPUT_GCLOUD)/log-based-metrics $(OUTPUT_TF) logging_metrics
	$(PYTHON) scripts/cvt-tf-alerts.py $(OUTPUT_GCLOUD)/alerts $(OUTPUT_TF) alerts
	prettier $(OUTPUT_TF) -c .prettierrc --write --prose-wrap always --print-width 120

.PHONY: build
build: clean alerts

.PHONY: build-tf
build-tf: clean alerts-tf

.PHONY: all
all: clean build build-tf

.PHONY: deploy-alerts
deploy-alerts:
	@echo "Deploying monitoring alerts and log based metrics..."
	bash scripts/deploy.sh  $(PROJECT_ID)  $(OUTPUT_GCLOUD)/log-based-metrics $(OUTPUT_GCLOUD)/alerts

.PHONY: deploy
deploy: all deploy-alerts

.PHONY: test
test: install all
	@echo "Running tests..."
	PROJECT_ID=$(PROJECT_ID) PROJECT_NUMBER=$(PROJECT_NUMBER) PREFIX=logmon $(PYTHON) -m pytest tests/main.py $(TEST_ARGS) -q --tb=short --no-header --show-capture=no

.PHONY: clean
clean:
	rm -rf $(OUTPUT_GCLOUD)
	rm -rf $(OUTPUT_TF)

.PHONY: check
check:
	yamllint -c .yamllint .