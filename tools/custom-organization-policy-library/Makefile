# Make will use bash instead of sh
SHELL 	:= /usr/bin/env bash
CONFIG 	:= -f build/config/schema.yaml -f build/config/services/ -f values.yaml -f build/ytt_lib/
OUTPUT_GCLOUD 	:= samples/gcloud
OUTPUT_TF := samples/tf

.PHONY: constraints
constraints: 
	rm -rf $(OUTPUT_GCLOUD)/constraints
	ytt $(CONFIG) -f build/custom-constraints/  --output-files $(OUTPUT_GCLOUD)/constraints

.PHONY: constraints-tf
constraints-tf: constraints
	python3 scripts/cvt-tf-constraints.py $(OUTPUT_GCLOUD)/constraints $(OUTPUT_TF)/custom-constraints

.PHONY: policies
policies: 
	rm -rf $(OUTPUT_GCLOUD)/policies
	ytt $(CONFIG) -f build/org-policies/  --output-files $(OUTPUT_GCLOUD)/policies
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

.PHONY: simulate
simulate: clean constraints policies
	bash scripts/simulate.sh $(OUTPUT_GCLOUD)/constraints $(OUTPUT_GCLOUD)/policies $(OUTPUT_GCLOUD)/simulation

.PHONY: deploy-constraints
deploy-constraints:
	sh scripts/deploy.sh constraint $(OUTPUT_GCLOUD)/constraints

.PHONY: deploy-policies
deploy-policies:
	sh scripts/deploy.sh policy $(OUTPUT_GCLOUD)/policies

.PHONY: deploy
deploy: deploy-constraints deploy-policies

.PHONY: config
config: 
	ytt $(CONFIG) -f build/config/config.yaml

.PHONY: clean
clean: 
	rm -rf $(OUTPUT_GCLOUD)
	rm -rf $(OUTPUT_TF)


