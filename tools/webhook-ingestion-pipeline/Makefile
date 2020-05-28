# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Automate Data Validation Testing
export PROJECT_ID:="my-project"
export PROJECT_NUMBER:="my-project-number"
export DEPLOY_MANAGER_NAME:=webhook-app

# Region When Applicable
export LOCATION:=US
export APP_REGION:=us-central
export REGION:=us-central1
export ZONE:=us-central1-b

# Pub/Sub Config Vars
export TOPIC:=${PROJECT_ID}-webhook
export SUBSCRIPTION:=dataflow-subscription

# GCS Config Vars
export BUCKET_NAME:=${PROJECT_ID}-webhook

# BigQuery Config
export BQ_DATASET:=webhook
export BQ_TABLE_TEMPLATE:=webhook_data
export BQ_DEADLETTER:=${PROJECT_ID}:${BQ_DATASET}.errors


variables:
	@echo "Setup Webhook Variables for project: ${PROJECT_ID}"
	@echo "${BQ_DEADLETTER}"

build: variables
	echo "Building Webhook Application for project: ${PROJECT_ID}"
	./build.sh

destroy: variables
	@echo "Tearing Down Webhook Application for project: ${PROJECT_ID}"
	./tear_down.sh
