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

# Convenience script for training model locally.
#
# Arguments:
#   MODEL_INPUTS_DIR: The directory containing the TFRecords from preprocessing.
#                     This should just be a timestamp.
. ./bin/_common.sh

MODEL_INPUTS_DIR=$1

PROJECT_ID="$(get_project_id)"
INPUT_BUCKET="gs://${PROJECT_ID}-bucket"
INPUT_PATH="${INPUT_BUCKET}/${USER}/${OUTPUT_DIR}/${MODEL_INPUTS_DIR}"
TFT_PATH="${INPUT_PATH}/${TFT_DIR}/transform_fn"

gcloud ai-platform local train \
  --job-dir "${MODEL_DIR}" \
  --module-name trainer.task \
  --package-path trainer \
  --distributed \
  -- \
  --model_dir "${MODEL_DIR}" \
  --input_dir "${INPUT_PATH}" \
  --tft_dir "${TFT_PATH}"

echo "Upon completion, serve the model by running: bin/run.serve.local.sh"
