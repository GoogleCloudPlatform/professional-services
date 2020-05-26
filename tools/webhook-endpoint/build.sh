#!/bin/bash

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

# NOTE: The Webhook App Deployment requires:
# 	- The project to exist before deployment


# Terraform Init and Apply
cd terraform/ || exit
echo "Apply Terraform Resources"
terraform init
terraform import google_app_engine_application.app ${PROJECT_ID}
terraform apply -auto-approve \
	-var "project_id=${PROJECT_ID}" \
	-var "project_num=${PROJECT_NUMBER}" \
	-var "webhook_location=${LOCATION}" \
	-var "webhook_app_region=${APP_REGION}" \
	-var "webhook_region=${REGION}" \
	-var "webhook_zone=${ZONE}" \
	-var "gcs_bucket_name=${BUCKET_NAME}" \
	-var "webhook_app=${DEPLOY_MANAGER_NAME}" \
	-var "pubsub_topic=${TOPIC}" \
	-var "pubsub_subscription=${SUBSCRIPTION}" \
	-var "bigquery_dataset=${BQ_DATASET}" \
	-var "bigquery_table_template=${BQ_TABLE_TEMPLATE}" \
	-var "dead_letter_queue=${BQ_DEADLETTER}"
cd ../ || exit

./deploy_dataflow.sh
