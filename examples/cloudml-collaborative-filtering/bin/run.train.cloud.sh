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

# Convenience script for training model on AI Platform.
#
# Arguments:
#   MODEL_INPUTS_DIR: The directory containing the TFRecords from preprocessing.
#                     This should just be a timestamp.
. ./bin/_common.sh

if [ "$#" -lt 1 ]; then
  echo "Illegal number of parameters. Should be >= 1, given $#."
  exit 1
fi

MODEL_INPUTS_DIR=$1

NOW="$(get_date_time)"
PROJECT_ID="$(get_project_id)"
INPUT_BUCKET="gs://${PROJECT_ID}-bucket"
OUTPUT_BUCKET="gs://${PROJECT_ID}-bucket"
INPUT_PATH="${INPUT_BUCKET}/${USER}/${OUTPUT_DIR}/${MODEL_INPUTS_DIR}"
TFT_PATH="${INPUT_PATH}/${TFT_DIR}/transform_fn"
MODEL_PATH="${OUTPUT_BUCKET}/${USER}/${MODEL_DIR}/${NOW}/"
TRAINING_JOB_NAME="${MODEL_NAME}_${NOW}"

gcloud ai-platform jobs submit training "${TRAINING_JOB_NAME}" \
  --module-name trainer.task \
  --staging-bucket "${OUTPUT_BUCKET}" \
  --package-path trainer \
  --region us-east1 \
  --runtime-version 1.15 \
  --scale-tier "${SCALE_TIER}" \
  -- \
  --model_dir "${MODEL_PATH}" \
  --input_dir "${INPUT_PATH}" \
  --tft_dir "${TFT_PATH}" \
  --max_steps 100000 \
  --batch_size 512 \
  --user_embed_mult 1.5 \
  --item_embed_mult 1 \
  --num_layers 5 \
  --embedding_size 50 \
  --learning_rate .0001

echo "Upon completion, serve the model by running: bin/run.serve.cloud.sh ${NOW}"
