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
. ./bin/_common.sh

NOW="$(get_date_time)"
PROJECT_ID="$(get_project_id)"
INPUT_BUCKET="gs://${PROJECT_ID}-bucket"
VERSION_NAME="v${NOW}_local"
MODEL_OUTPUTS_PATH="models/${DEFAULT_TRIAL}/export/export/"
MODEL_PATH="${MODEL_OUTPUTS_PATH}$(ls ${MODEL_OUTPUTS_PATH} | tail -n1)"

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

echo "Make predictions by running: bin/run.predict.local.sh ${VERSION_NAME}"
