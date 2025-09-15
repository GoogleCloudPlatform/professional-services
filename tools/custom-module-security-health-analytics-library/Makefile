SHELL 	:= /usr/bin/env bash

INPUT_VALUES    := $(or $(CUSTOM_SHA_INPUT_VALUES), values.yaml)
OUTPUT_GCLOUD   := $(or $(CUSTOM_SHA_OUTPUT_GCLOUD), samples/gcloud)
OUTPUT_TF       := $(or $(CUSTOM_SHA_OUTPUT_TF), samples/tf)

CONFIG := -f build/config/schema.yaml -f build/config/services/ -f $(INPUT_VALUES) -f build/ytt_lib/

YQ := $(shell command -v yq 2> /dev/null)
ifndef YQ
    $(error "yq is not installed or not in PATH. Please install yq: https://github.com/mikefarah/yq/#install")
endif

ORGANIZATION_ID := $(shell $(YQ) '.organization' ${INPUT_VALUES})

.PHONY: sha
sha: 
	rm -rf $(OUTPUT_GCLOUD)
	ytt $(CONFIG) -f build/custom-sha/  --output-files $(OUTPUT_GCLOUD)

.PHONY: sha-tf
sha-tf: sha
	python3 scripts/cvt-tf-custom-sha-modules.py $(OUTPUT_GCLOUD) $(OUTPUT_TF)

.PHONY: build
build: clean sha

.PHONY: build-tf
build-tf: clean sha-tf

.PHONY: all
all: clean build build-tf

.PHONY: deploy-sha
deploy-sha:
	sh scripts/deploy.sh sha $(OUTPUT_GCLOUD) --organization $(ORGANIZATION_ID)

.PHONY: deploy
deploy: build deploy-sha

.PHONY: clean
clean: 
	rm -rf $(OUTPUT_GCLOUD)
	rm -rf $(OUTPUT_TF)


