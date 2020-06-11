#!/bin/bash
# Copyright 2020 Google Inc. All Rights Reserved.
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

# Undeploy the AutoML Tables model for online prediction.
#
# Usage: bash undeploy_model.sh config_file.yaml
#
# Undeploys the AutoML model for online prediction.
# Uses application default credentials. You may be prompted to authenticate.
# Model deployment takes as long as 15 minutes before you can make predictions.
#
# The undeployment is a long-running operation (LRO), and you'll need to check
# the operation to determine when it is complete. The "name" field of the
# response is used to check the operation with a command like so, replacing
# operation-name with the name from the undeployment request:
# curl -X GET \
#   -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
#   -H "Content-Type: application/json" \
#   https://automl.googleapis.com/v1beta1/operation-name
#

CONFIG_FILE_PATH=$1

do_shyaml() {
# Get a value from the config file for a given key.
  local key=$1
  cat "${CONFIG_FILE_PATH}" | shyaml get-value "${key}"
}

echo Reading config.
PROJECT_ID="$(do_shyaml global.destination_project_id)"
REGION="$(do_shyaml global.automl_compute_region)"
MODEL_NAME="$(do_shyaml global.model_display_name)"
CREDENTIALS="$(gcloud auth application-default print-access-token)"
MODEL_ID=$(curl -s -X GET -H "Authorization: Bearer "${CREDENTIALS} \
https://automl.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${REGION}/models \
| jq -r --arg MODEL_NAME "$MODEL_NAME" \
'.model[] | select(.displayName==$MODEL_NAME) | .name' \
| cut -d'/' -f6)

echo Deploying model.
curl -X POST \
-H "Authorization: Bearer "${CREDENTIALS} \
-H "Content-Type: application/json; charset=utf-8" \
-d "" \
https://automl.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${REGION}/models/${MODEL_ID}:undeploy
