#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

SHELL := /bin/bash

APP_NAME := api-key-rotation

VERSION ?= 1.0.0

.PHONY: dev setup test run clean

setup:
	@echo "Setting up python virtual environment.."
	@python3 -m venv .venv

install:
	@echo "Installing required packages.."
	@source .venv/bin/activate && pip3 install -r requirements.txt

dev:
	@echo "Installing required devlopment packages.."
	@source .venv/bin/activate && pip3 install -r requirements-dev.txt

test:
	@echo "Running unit tests.."
	@PYTHONPATH=$(shell pwd) pytest --log-cli-level=10

run:
	@echo "Executing api key rotation script.."
	@python3 api_key_rotation_checker/main.py

clean:
	@echo "Removing virtual environment.."
	@rm -rf .venv
