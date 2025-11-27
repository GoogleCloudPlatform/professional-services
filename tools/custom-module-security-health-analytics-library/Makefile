SHELL 	:= /usr/bin/env bash

PYTHON = $(VENV_DIR)/bin/python
PIP = $(VENV_DIR)/bin/pip
VENV_DIR = venv
VENV_MARKER = source $(VENV_DIR)/bin/activate

PROJECT_ID      := $(or $(CUSTOM_SHA_PROJECT_ID), myproject)
INPUT_VALUES    := $(or $(CUSTOM_SHA_INPUT_VALUES), values.yaml)
OUTPUT_GCLOUD   := $(or $(CUSTOM_SHA_OUTPUT_GCLOUD), samples/gcloud)
OUTPUT_TF       := $(or $(CUSTOM_SHA_OUTPUT_TF), samples/tf)
CONFIG 			:= -f build/config/schema.yaml -f build/config/services/ -f $(INPUT_VALUES) -f build/ytt_lib/

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

DEPLOYMENT_PARENT :=  $(or $(DEPLOYMENT_PARENT), $(shell $(YQ) '.deployment.parent' ${INPUT_VALUES}))
PARENT_TYPE := $(shell echo $(DEPLOYMENT_PARENT) | cut -d'/' -f1)
PARENT_ID :=   $(shell echo $(DEPLOYMENT_PARENT) | cut -d'/' -f2)

PARENT_FLAG := $(shell if [ "$(PARENT_TYPE)" = "organizations" ]; then echo "--organization"; elif [ "$(PARENT_TYPE)" = "folders" ]; then echo "--folder"; elif [ "$(PARENT_TYPE)" = "projects" ]; then echo "--project"; fi)

DEPLOY_ARGS = $(OUTPUT_GCLOUD) $(PARENT_FLAG) $(PARENT_ID) 
ifneq ($(DEPLOY_CONTROL),)
    DEPLOY_ARGS += --control $(DEPLOY_CONTROL)
endif

.PHONY: install
install: 
	@echo "Creating virtual environment in $(VENV_DIR)..."
	python3 -m venv $(VENV_DIR)
	@echo "Virtual environment created."
	@echo "Run 'make install' to install dependencies."
	$(VENV_MARKER)
	$(PIP) install -r scripts/requirements.txt
	$(PIP) install -r tests/requirements.txt

.PHONY: install sha
sha: 
	rm -rf $(OUTPUT_GCLOUD)
	ytt $(CONFIG) -f $(CUSTOM_SHA_DIR) --output-files $(OUTPUT_GCLOUD)
	prettier $(OUTPUT_GCLOUD) -c .prettierrc --write --prose-wrap always --print-width 120

.PHONY: sha-tf
sha-tf: sha
	$(PYTHON) scripts/cvt-tf-custom-sha-modules.py $(OUTPUT_GCLOUD) $(OUTPUT_TF)
	prettier $(OUTPUT_TF) -c .prettierrc --write --prose-wrap always --print-width 120

.PHONY: build
build: clean sha

.PHONY: build-tf
build-tf: clean sha-tf

.PHONY: all
all: clean build build-tf

.PHONY: deploy-sha
deploy-sha:
	@echo "Deploying custom sha modules..."
	bash scripts/deploy.sh sha $(DEPLOY_ARGS)

.PHONY: deploy
deploy: all deploy-sha

.PHONY: test
test: install all
	@echo "Running tests..."
	PROJECT_ID=$(PROJECT_ID) $(PYTHON) -m pytest tests/main.py $(TEST_ARGS) -q --tb=short --no-header --show-capture=no

.PHONY: clean
clean: 
	rm -rf $(OUTPUT_GCLOUD)
	rm -rf $(OUTPUT_TF)

.PHONY: check
check:
	yamllint -c .yamllint .