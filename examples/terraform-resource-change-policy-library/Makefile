# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Make will use bash instead of sh
SHELL := /usr/bin/env bash

CV_IMAGE_URL := gcr.io/config-validator

POLICY_TOOL_IMAGE := policy-tool
POLICY_TOOL_IMAGE_TAG := latest

REGO_IMAGE_V15 := rego-v0.15.0
REGO_IMAGE_V16 := rego-v0.16.0
REGO_IMAGE_V29 := rego-v0.29.3
REGO_IMAGE_TAG := latest


# The .PHONY directive tells make that this isn't a real target and so
# the presence of a file with that name won't cause this target to stop
.PHONY: test
test: ## Test constraint templates via OPA
	@echo "Running OPA tests..."
	@opa test --timeout 30s -v validator/ --explain=notes

.PHONY: docker_test_opa_v15
docker_test_opa_v15: ## Run tests using CV rego docker image v0.15.x
	docker run -it --rm \
		-v "$(CURDIR):/workspace" \
		-w=/workspace \
		$(CV_IMAGE_URL)/$(REGO_IMAGE_V15):$(REGO_IMAGE_TAG) \
		test

.PHONY: docker_test_opa_v16
docker_test_opa_v16: ## Run tests using CV rego docker image v0.16.x
	docker run -it --rm \
		-v "$(CURDIR):/workspace" \
		-w=/workspace \
		$(CV_IMAGE_URL)/$(REGO_IMAGE_V16):$(REGO_IMAGE_TAG) \
		test

.PHONY: docker_test_opa_v29
docker_test_opa_v29: ## Run tests using CV rego docker image v0.29.x
	docker run -it --rm \
		-v "$(CURDIR):/workspace" \
		-w=/workspace \
		$(CV_IMAGE_URL)/$(REGO_IMAGE_V29):$(REGO_IMAGE_TAG) \
		test

# Run tests using CV rego docker image
.PHONY: docker_test
docker_test: docker_test_opa_v15 docker_test_opa_v16 docker_test_opa_v29

.PHONY: docker_test_lint
docker_test_lint: # Run lint tests using policy tool docker image
	docker run -it --rm \
		-v "$(CURDIR):/workspace" \
		-w=/workspace \
		$(CV_IMAGE_URL)/$(POLICY_TOOL_IMAGE):$(POLICY_TOOL_IMAGE_TAG) \
		lint \
		--policies /workspace/policies \
		--policies /workspace/samples

.PHONY: debug
debug: ## Show debugging output from OPA
	@opa eval --data=validator/ --format=pretty "data.validator.gcp"

.PHONY: build_templates
build_templates: ## Inline Rego rules into constraint templates
	@python3 scripts/inline_rego.py

.PHONY: format
format: ## Format Rego rules
	@opa fmt -w validator/

.PHONY: build
build: format build_templates ## Format and build

.PHONY: check_sample_files
check_sample_files: ## Make sure each template in policies/templates has one sample file using it in samples/
	@python3 scripts/check_samples.py

.PHONY: check_sample_files
docker_check_sample_files: ## Make sure each template in policies/templates has one sample file using it in samples/
	docker run -it --rm \
		-v "$(CURDIR):/workspace" \
		-w=/workspace \
		--entrypoint python3 \
		$(CV_IMAGE_URL)/$(REGO_IMAGE_V15):$(REGO_IMAGE_TAG) \
		/workspace/scripts/check_samples.py

.PHONY: check_format
check_format: ## Check that files have been formatted using opa fmt
	@./scripts/check_format.sh

.PHONY: docker_check_format
docker_check_format: ## Check format of rego using CV rego docker image
	docker run -it --rm \
		-v "$(CURDIR):/workspace" \
		-w=/workspace \
		$(CV_IMAGE_URL)/$(REGO_IMAGE_V15):$(REGO_IMAGE_TAG) \
		check_format

.PHONY: check_build
check_build: ## Check that templates have been built
	@./scripts/check_build.sh

.PHONY: docker_check_build
docker_check_build: ## Check that templates have been built using CV rego docker image
	docker run -it --rm \
		-v "$(CURDIR):/workspace" \
		-w=/workspace \
		$(CV_IMAGE_URL)/$(REGO_IMAGE_V15):$(REGO_IMAGE_TAG) \
		check_build

.PHONY: audit
audit: ## Run audit against real CAI dump data
	@echo "Running config-validator audit ..."
	@bash scripts/cft.sh -o "$(ORG_ID)" -f "$(FOLDER_ID)" -p "$(PROJECT_ID)" -b "$(BUCKET_NAME)" -e "$(EXPORT)"

help: ## Prints help for targets with comments
	@grep -E '^[a-zA-Z._-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "make \033[36m%- 30s\033[0m %s\n", $$1, $$2}'

# Cloudbuild doesn't allow us to use the Dockerfile "ARG" feature so we have to
# template the dockerfile, expand for each version then build.
REGO_VERSIONS := v0.15.0 v0.16.0 v0.24.0 v0.29.3
CI_IMAGES := $(foreach v,$(REGO_VERSIONS),ci-image-$v)
.PHONY: ci-images
ci-images: $(CI_IMAGES)

ci-image-%: build/rego-%/Dockerfile
	@cd $(dir $^) \
	&& gcloud builds submit --project=config-validator --tag gcr.io/config-validator/rego-$* .

build/rego-%/Dockerfile: cloudbuild/Dockerfile
	@mkdir -p $(dir $@)
	@sed -e 's/__REGO_VERSION__/$*/' $^ > $@

# KPT Targets

## Generate docs
.PHONY: generate_docs
generate_docs: # Generate docs
	@echo "Generating docs with kpt..."
	$(eval TMP_DIR := $(shell mktemp -d))
	@cp -R ./samples/ $(TMP_DIR)
	@cp -R ./policies/ $(TMP_DIR)
	@kpt fn eval $(TMP_DIR) --image gcr.io/config-validator/generate-docs:dev --mount type=bind,src="$(shell pwd)/docs",dst=/docs,rw=true --fn-config docs/func.yaml
	@rm -rf $(TMP_DIR)

.PHONY: docker_build_kpt
docker_build_kpt: ## Build docker image for KPT functions
	docker build -f ./bundler/build/get_policy_bundle.Dockerfile -t gcr.io/config-validator/get-policy-bundle:dev ./bundler/
	docker build -f ./bundler/build/generate_docs.Dockerfile -t gcr.io/config-validator/generate-docs:dev ./bundler/

.PHONY: docker_push_kpt
docker_push_kpt: ## Push docker image for KPT functions
	docker push gcr.io/config-validator/get-policy-bundle:dev
	docker push gcr.io/config-validator/generate-docs:dev

.PHONY: docker_test_kpt
docker_test_kpt: ## Run npm test for KPT functions
	docker run -i \
		--entrypoint=npm \
		-v $(CURDIR):/workspace \
		docker.io/library/node:10.20.1-alpine3.11 \
		--prefix /workspace/bundler/ test

.PHONY: docker_test_lint_kpt
docker_test_lint_kpt: ## Run tslint for KPT functions
	docker run -i \
		--entrypoint=npm \
		-v $(CURDIR):/workspace \
		docker.io/library/node:10.20.1-alpine3.11 \
		--prefix /workspace/bundler/ run lint