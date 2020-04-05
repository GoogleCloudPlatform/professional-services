# Copyright 2020 Google LLC
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

args = `arg="$(filter-out $@,$(MAKECMDGOALS))" && echo $${arg:-${1}}`


.PHONY: lint
lint: check_shell check_python check_golang check_terraform check_base_files check_headers check_trailing_whitespace

.PHONY: dockerbuild
dockerbuild:
	@docker build -t inspec-pci-cis:latest docker

.PHONY: test
test:
	@docker run --rm -it \
          -e GOOGLE_APPLICATION_CREDENTIALS=/root/.config/gcloud/$YOUR_MAIN_PROJECT.json \
          -e TERM=xterm-256color \
          -v `pwd`:/share/inspec-combination-profile \
          -v `pwd`/../inspec-gcp-cis-benchmark:/share/inspec-gcp-cis-benchmark \
          -v `pwd`/../inspec-gcp-pci-3.2.1:/share/inspec-gcp-pci-3.2.1 \
          -v ~/.config:/root/.config \
          -w /share/inspec-combination-profile \
          inspec-pci-cis:latest \
          inspec exec . -t gcp:// --attrs /share/inspec-combination-profile/attrs.yaml

.PHONY: test-debug
test-debug:
	@docker run --rm -it \
          -e GOOGLE_APPLICATION_CREDENTIALS=/root/.config/gcloud/$YOUR_MAIN_PROJECT.json \
          -e TERM=xterm-256color \
          -v `pwd`:/share/inspec-combination-profile \
          -v `pwd`/../inspec-gcp-cis-benchmark:/share/inspec-gcp-cis-benchmark \
          -v `pwd`/../inspec-gcp-pci-3.2.1:/share/inspec-gcp-pci-3.2.1 \
          -v ~/.config:/root/.config \
          -w /share/inspec-combination-profile \
          inspec-pci-cis:latest \
          inspec exec . -t gcp:// --attrs /share/inspec-combination-profile/attrs.yaml \
            --log-level=debug

.PHONY: shell
shell:
	@docker run --rm -it \
          -e GOOGLE_APPLICATION_CREDENTIALS=/root/.config/gcloud/$YOUR_MAIN_PROJECT.json \
          -e TERM=xterm-256color \
          -v `pwd`:/share/inspec-combination-profile \
          -v `pwd`/../inspec-gcp-cis-benchmark:/share/inspec-gcp-cis-benchmark \
          -v `pwd`/../inspec-gcp-pci-3.2.1:/share/inspec-gcp-pci-3.2.1 \
          -v ~/.config:/root/.config \
          -w /share/inspec-combination-profile \
          inspec-pci-cis:latest \
          $(call args,bash)

.PHONY: %
%:
	@:

# Linting
.PHONY: check_shell
check_shell:
	@source test/make.sh && check_shell

.PHONY: check_python
check_python:
	@source test/make.sh && check_python

.PHONY: check_golang
check_golang:
	@source test/make.sh && golang

.PHONY: check_terraform
check_terraform:
	@source test/make.sh && check_terraform

.PHONY: check_docker
check_docker:
	@source test/make.sh && docker

.PHONY: check_base_files
check_base_files:
	@source test/make.sh && basefiles

.PHONY: check_shebangs
check_shebangs:
	@source test/make.sh && check_bash

.PHONY: check_trailing_whitespace
check_trailing_whitespace:
	@source test/make.sh && check_trailing_whitespace

.PHONY: check_headers
check_headers:
	@echo "Checking file headers"
	@python test/verify_boilerplate.py
