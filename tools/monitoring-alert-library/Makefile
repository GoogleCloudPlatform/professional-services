# Make will use bash instead of sh
SHELL 	:= /usr/bin/env bash
CONFIG := -f build/config/schema.yaml -f values.yaml -f build/ytt_lib/
OUTPUT_GCLOUD 	:= samples/gcloud

YQ := $(shell command -v yq 2> /dev/null)
ifndef YQ
    $(error "yq is not installed or not in PATH. Please install yq: https://github.com/mikefarah/yq/#install")
endif

PROJECT_ID := $(shell $(YQ) '.project' values.yaml)

.PHONY: alerts
alerts: 
	rm -rf $(OUTPUT_GCLOUD)/alerts
	ytt $(CONFIG) -f build/alerts/  --output-files $(OUTPUT_GCLOUD)/alerts

.PHONY: build
build: clean alerts

.PHONY: deploy-alerts
deploy-alerts:
	sh scripts/deploy.sh  $(PROJECT_ID)  $(OUTPUT_GCLOUD)/alerts

.PHONY: deploy
deploy: build deploy-alerts

.PHONY: clean
clean: 
	rm -rf $(OUTPUT_GCLOUD)


