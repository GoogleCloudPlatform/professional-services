SHELL 	:= /usr/bin/env bash

INPUT_VALUES    := $(or $(CUSTOM_OP_INPUT_VALUES), values.yaml)
OUTPUT_GCLOUD   := $(or $(CUSTOM_OP_OUTPUT_GCLOUD), samples/gcloud)
OUTPUT_TF       := $(or $(CUSTOM_OP_OUTPUT_TF), samples/tf)

CONFIG 	:= -f build/config/schema.yaml -f build/config/services/ -f $(INPUT_VALUES) -f build/ytt_lib/

# By default, generating all services 
# For testing, can be set SERVICE := "cloudsql"
# SERVICE := "cloudrun"

CUSTOM_CONSTRAINTS_BASE_DIR := build/custom-constraints/
CUSTOM_CONSTRAINTS_DIR := $(CUSTOM_CONSTRAINTS_BASE_DIR)

ifneq ($(strip $(SERVICE)),"")
  CUSTOM_CONSTRAINTS_DIR := $(CUSTOM_CONSTRAINTS_BASE_DIR)$(SERVICE)
  POLICIES_PARAM := -v service=$(SERVICE) 
endif

.PHONY: constraints
constraints: 
	rm -rf $(OUTPUT_GCLOUD)/constraints
	ytt $(CONFIG) -f $(CUSTOM_CONSTRAINTS_DIR) --output-files $(OUTPUT_GCLOUD)/constraints

.PHONY: constraints-tf
constraints-tf: constraints
	python3 scripts/cvt-tf-constraints.py $(OUTPUT_GCLOUD)/constraints $(OUTPUT_TF)/custom-constraints

.PHONY: policies
policies: 
	rm -rf $(OUTPUT_GCLOUD)/policies
	ytt $(CONFIG) -f build/org-policies/ $(POLICIES_PARAM)  --output-files $(OUTPUT_GCLOUD)/policies
	python3 scripts/format-policies.py $(OUTPUT_GCLOUD)/policies/policies.yaml $(OUTPUT_GCLOUD)/policies
	rm $(OUTPUT_GCLOUD)/policies/policies.yaml

.PHONY: policies-tf
policies-tf: policies
	python3 scripts/cvt-tf-policies.py $(OUTPUT_GCLOUD)/policies $(OUTPUT_TF)/custom-policies

.PHONY: build
build: clean constraints policies

.PHONY: build-tf
build-tf: clean constraints-tf policies-tf

.PHONY: all
all: clean build build-tf
	prettier $(OUTPUT_GCLOUD) -c .prettierrc --write --prose-wrap always
	prettier $(OUTPUT_TF) -c .prettierrc --write --prose-wrap always

.PHONY: simulate
simulate: clean constraints policies
	bash scripts/simulate.sh $(OUTPUT_GCLOUD)/constraints $(OUTPUT_GCLOUD)/policies $(OUTPUT_GCLOUD)/simulation

.PHONY: deploy-constraints
deploy-constraints:
	bash scripts/deploy.sh constraint $(OUTPUT_GCLOUD)/constraints

.PHONY: deploy-policies
deploy-policies:
	bash scripts/deploy.sh policy $(OUTPUT_GCLOUD)/policies

.PHONY: deploy
deploy: deploy-constraints deploy-policies

.PHONY: config
config: 
	ytt $(CONFIG) -f build/config/config.yaml

.PHONY: clean
clean: 
	rm -rf $(OUTPUT_GCLOUD)
	rm -rf $(OUTPUT_TF)

.PHONY: check
check:
	yamllint -c .yamllint .