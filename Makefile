# Copyright 2018 Google LLC
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

# The .PHONY directive tells make that this isn't a file target
.PHONY: fmt
fmt: ## Format files, including README
#	@python3 ./helpers/sort_lists.py README.MD
	@$$SHELL ./helpers/format.sh

help: ## Prints help for targets with comments
	@grep -E '^[a-zA-Z._-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS=":.*?## "}; {printf "make \033[36m%- 30s\033[0m %s\n", $$1, $$2}'

.PHONY: test
test: ## Test if all files are properly formatted
	@$$SHELL ./helpers/check_format.sh


.PHONY: push_ci_image
push_ci_image:
	@cd cloudbuild && gcloud builds submit --project=cloud-eng-council --tag gcr.io/cloud-eng-council/make .
