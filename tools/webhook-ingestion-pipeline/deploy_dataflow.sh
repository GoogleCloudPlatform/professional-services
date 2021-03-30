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


# Dataflow Config Vars
NEW_UUID=$(head -n 50 /dev/urandom | tr -dc 'a-z0-9' | fold -w 6 | head -n 1)
export DATAFLOW_JOB_NAME="webhook-job-${NEW_UUID}"

# Deploy Template Vars
export TEMPLATE_IMAGE_SPEC=gs://dataflow-templates/latest/flex/PubSub_CDC_to_BigQuery
export TOPIC_PATH=projects/${PROJECT_ID}/topics/${TOPIC}
export SUBSCRIPTION_PATH=projects/${PROJECT_ID}/subscriptions/${SUBSCRIPTION}
export DATASET_TEMPLATE=${BQ_DATASET}
export TABLE_NAME_TEMPLATE=${BQ_TABLE_TEMPLATE}

gcloud beta dataflow flex-template run "${DATAFLOW_JOB_NAME}" \
        --project="${PROJECT_ID}" --region="${REGION}" \
        --template-file-gcs-location="${TEMPLATE_IMAGE_SPEC}" \
        --parameters inputSubscription="${SUBSCRIPTION_PATH}",outputDatasetTemplate="${DATASET_TEMPLATE}",outputTableNameTemplate="${TABLE_NAME_TEMPLATE}",outputDeadletterTable="${BQ_DEADLETTER}"
