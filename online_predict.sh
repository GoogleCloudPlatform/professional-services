#!/bin/bash
# Copyright 2012 Google LLC
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
# ==============================================================================

# Make an online prediction with the deployed AutoML Tables model.
#
# Usage: bash deploy_model.sh config_file.yaml payload.json
#
# Uses application default credentials. You may be prompted to authenticate.
# The model must be deployed before you can make predictions.
#
# payload.json must follow the expected structure detailed at 
# https://cloud.google.com/automl-tables/docs/predict#getting_an_online_prediction

CONFIG_FILE_PATH=$1
PREDICT_JSON=$2

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
https://automl.googleapis.com/v1beta1/projects/ut-goog/locations/us-central1/models\
| jq -r --arg MODEL_NAME "$MODEL_NAME" \
'.model[] | select(.displayName==$MODEL_NAME) | .name'\
| cut -d'/' -f6)

echo Making prediction.
curl -X POST \
-H "Authorization: Bearer "${CREDENTIALS} \
-H "Content-Type: application/json; charset=utf-8" \
-d @$2 \
https://automl.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${REGION}/models/${MODEL_ID}:predict
