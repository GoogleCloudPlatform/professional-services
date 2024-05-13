# Make will use bash instead of sh
SHELL 	:= /usr/bin/env bash
CONFIG 	:= -f build/config/schema.yaml -f build/config/services/ -f values.yaml -f build/ytt_lib/
OUTPUT 	:= samples
OUTPUT_TF := tf/data

.PHONY: constraints
constraints: 
	rm -rf $(OUTPUT)/constraints
	ytt $(CONFIG) -f build/custom-constraints/  --output-files $(OUTPUT)/constraints

.PHONY: constraints-tf
constraints-tf: constraints
	python3 scripts/cvt-tf-constraints.py $(OUTPUT)/constraints tf/data/custom-constraints

.PHONY: policies
policies: 
	rm -rf $(OUTPUT)/policies
	ytt $(CONFIG) -f build/org-policies/  --output-files $(OUTPUT)/policies
	python3 scripts/format-policies.py $(OUTPUT)/policies/policies.yaml $(OUTPUT)/policies
	rm $(OUTPUT)/policies/policies.yaml

.PHONY: policies-tf
policies-tf: policies
	python3 scripts/cvt-tf-policies.py $(OUTPUT)/policies tf/data/custom-policies

.PHONY: build
build: clean constraints policies

.PHONY: build-tf
build-tf: clean constraints-tf policies-tf

.PHONY: deploy-constraint
deploy-constraint:
	sh scripts/deploy.sh constraint $(OUTPUT)/constraints

.PHONY: deploy-policy
deploy-policy:
	sh scripts/deploy.sh policy $(OUTPUT)/policies

.PHONY: deploy
deploy: deploy-constraint deploy-policy

.PHONY: config
config: 
	ytt $(CONFIG) -f build/config/config.yaml

.PHONY: clean
clean: 
	rm -rf $(OUTPUT)
	rm -rf $(OUTPUT_TF)


