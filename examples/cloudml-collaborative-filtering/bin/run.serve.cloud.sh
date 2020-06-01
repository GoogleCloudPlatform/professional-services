#!/bin/bash

# Copyright 2019 Google Inc. All Rights Reserved.
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

# Convenience script for serving model on AI Platform.
#
# Arguments:
#   MODEL_OUTPUTS_DIR: The model directory containing each model trial.
#                      This should just be a timestamp.
#   TRIAL (optional): The trial number to use.
. ./bin/_common.sh

if [ "$#" -lt 1 ]; then
  echo "Illegal number of parameters. Should be >= 1, given $#."
  exit 1
fi

MODEL_OUTPUTS_DIR=$1
TRIAL=${2:-${DEFAULT_TRIAL}}

PROJECT_ID="$(get_project_id)"
VERSION_NAME="v${MODEL_OUTPUTS_DIR}_${TRIAL}"
INPUT_BUCKET="gs://${PROJECT_ID}-bucket"
MODEL_OUTPUTS_PATH="${INPUT_BUCKET}/${USER}/${MODEL_DIR}/${MODEL_OUTPUTS_DIR}/${TRIAL}/export/export"
MODEL_PATH="$(gsutil ls ${MODEL_OUTPUTS_PATH} | tail -n1)"

gcloud ai-platform models create "${MODEL_NAME}" \
  --regions us-east1 \
  &> /dev/null

gcloud ai-platform versions create "${VERSION_NAME}" \
  --model "${MODEL_NAME}" \
  --origin "${MODEL_PATH}" \
  --staging-bucket "${INPUT_BUCKET}" \
  --runtime-version 1.13 \
  --framework TENSORFLOW

gcloud ai-platform versions describe "${VERSION_NAME}" \
    --model "${MODEL_NAME}"

echo "Make predictions by running: bin/run.predict.cloud.sh ${MODEL_OUTPUTS_DIR} ${TRIAL}"
