# Make will use bash instead of sh
SHELL 	:= /usr/bin/env bash
CONFIG 	:= -f build/config/schema.yaml -f build/config/services/ -f values.yaml -f build/ytt_lib/
OUTPUT 	:= samples

.PHONY: constraints
constraints: 
	rm -rf $(OUTPUT)/constraints
	ytt $(CONFIG) -f build/custom-constraints/  --output-files $(OUTPUT)/constraints

.PHONY: policies
policies: 
	rm -rf $(OUTPUT)/policies
	ytt $(CONFIG) -f build/org-policies/  --output-files $(OUTPUT)/policies
	sh scripts/format-policies.sh $(OUTPUT)/policies

.PHONY: build
build: clean constraints policies

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

