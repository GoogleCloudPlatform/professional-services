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

# Required Vars for deployment
export PROJECT_ID:="my-project"
export PROJECT_NUMBER:="my-project-number"

# Terraform Variables
export TF_VAR_project_id:=${PROJECT_ID}
export TF_VAR_project_num:=${PROJECT_NUMBER}
export TF_VAR_webhook_app:=webhook-app

# Region When Applicable
export TF_VAR_webhook_location:=US
export TF_VAR_webhook_app_region=us-central
export TF_VAR_webhook_region:=us-central1
export TF_VAR_webhook_zone:=us-central1-b

# GCS Config Vars
export TF_VAR_gcs_bucket_prefix:=webhook

# Pub/Sub Config Vars
export TF_VAR_pubsub_topic:=${PROJECT_ID}-webhook
export TF_VAR_pubsub_subscription:=dataflow-subscription

# BigQuery Config
export TF_VAR_bigquery_dataset:=webhook
export TF_VAR_bigquery_table_template:=webhook_data
export TF_VAR_dead_letter_queue:=${PROJECT_ID}:${TF_VAR_bigquery_dataset}.errors

# TODO: Used to deploy Dataflow, remove once Flex Terraform is releases
export REGION:=${TF_VAR_webhook_region}
export TOPIC:=${TF_VAR_pubsub_topic}
export SUBSCRIPTION:=${TF_VAR_pubsub_subscription}
export BQ_DATASET:=${TF_VAR_bigquery_dataset}
export BQ_TABLE_TEMPLATE:=${TF_VAR_bigquery_table_template}
export BQ_DEADLETTER:=${TF_VAR_dead_letter_queue}

variables:
	@echo "Setup Webhook Variables for project: ${TF_VAR_project_id}"
	@echo "Dead Letter Table: ${TF_VAR_dead_letter_queue}"

build: variables
	echo "Building Webhook Application for project: ${TF_VAR_project_id}"
	./build.sh

destroy: variables
	@echo "Tearing Down Webhook Application for project: ${TF_VAR_project_id}"
	./tear_down.sh
