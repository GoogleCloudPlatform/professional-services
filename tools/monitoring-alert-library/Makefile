SHELL 	:= /usr/bin/env bash

INPUT_VALUES    := $(or $(MONITORING_ALERT_INPUT_VALUES), values.yaml)
OUTPUT_GCLOUD   := $(or $(MONITORING_ALERT_OUTPUT_GCLOUD), samples/gcloud)
OUTPUT_TF       := $(or $(MONITORING_ALERT_OUTPUT_TF), samples/tf)
CONFIG := -f build/config/schema.yaml -f $(INPUT_VALUES) -f build/ytt_lib/


YQ := $(shell command -v yq 2> /dev/null)
ifndef YQ
    $(error "yq is not installed or not in PATH. Please install yq: https://github.com/mikefarah/yq/#install")
endif

PROJECT_ID := $(shell $(YQ) '.project' ${INPUT_VALUES})

.PHONY: alerts
alerts:
	rm -rf $(OUTPUT_GCLOUD)/log-based-metrics	
	rm -rf $(OUTPUT_GCLOUD)/alerts
	ytt $(CONFIG) -f build/log-based-metrics/  --output-files $(OUTPUT_GCLOUD)/log-based-metrics
	ytt $(CONFIG) -f build/alerts/  --output-files $(OUTPUT_GCLOUD)/alerts

.PHONY: alerts-tf
alerts-tf: alerts
	python3 scripts/cvt-tf-alerts.py $(OUTPUT_GCLOUD)/log-based-metrics $(OUTPUT_TF) logging_metrics
	python3 scripts/cvt-tf-alerts.py $(OUTPUT_GCLOUD)/alerts $(OUTPUT_TF) alerts

.PHONY: build
build: clean alerts

.PHONY: build-tf
build-tf: clean alerts-tf

.PHONY: all
all: clean build build-tf

.PHONY: deploy-alerts
deploy-alerts:
	sh scripts/deploy.sh  $(PROJECT_ID)  $(OUTPUT_GCLOUD)/log-based-metrics $(OUTPUT_GCLOUD)/alerts

.PHONY: deploy
deploy: build deploy-alerts

.PHONY: clean
clean:
	rm -rf $(OUTPUT_GCLOUD)
