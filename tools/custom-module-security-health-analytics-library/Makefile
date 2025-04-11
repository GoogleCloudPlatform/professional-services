# Make will use bash instead of sh
SHELL 	:= /usr/bin/env bash
CONFIG := -f build/config/schema.yaml -f build/config/services/ -f values.yaml -f build/ytt_lib/
OUTPUT_GCLOUD 	:= samples/gcloud

YQ := $(shell command -v yq 2> /dev/null)
ifndef YQ
    $(error "yq is not installed or not in PATH. Please install yq: https://github.com/mikefarah/yq/#install")
endif

ORGANIZATION_ID := $(shell $(YQ) '.organization' values.yaml)

.PHONY: sha
sha: 
	rm -rf $(OUTPUT_GCLOUD)/sha
	ytt $(CONFIG) -f build/custom-sha/  --output-files $(OUTPUT_GCLOUD)/custom-sha

.PHONY: build
build: clean sha

.PHONY: deploy-sha
deploy-sha:
	sh scripts/deploy.sh sha $(OUTPUT_GCLOUD)/custom-sha/ --organization $(ORGANIZATION_ID)

.PHONY: deploy
deploy: build deploy-sha

.PHONY: clean
clean: 
	rm -rf $(OUTPUT_GCLOUD)
	rm -rf $(OUTPUT_TF)


