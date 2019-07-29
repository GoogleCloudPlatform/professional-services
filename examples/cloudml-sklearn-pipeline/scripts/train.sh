#!/usr/bin/env bash

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
# ==============================================================================
#
# Convenience script for running ML training jobs.
#
# Prerequisites:
#   - Google Cloud SDK
#
# Globals:
#   PROJECT_ID: Google Cloud project to use.
#   BUCKET_ID: Google Cloud Storage bucket to store output.
#
# Arguments:
#   $1: Path or BigQuery table to dataset for ML training and eval,
#       specified as PROJECT_ID.DATASET.TABLE_NAME.
#   $2: (Optional) Whether to run `local` (on-prem) or `remote` (GCP).
#   $3: (Optional) Whether to run `train` or `hptuning`.
#   $4: (Optional) additional arguments to pass to the trainer.


INPUT=$1
RUN_ENV=$2
RUN_TYPE=$3
EXTRA_TRAINER_ARGS=$4

if [[ ! "$RUN_ENV" =~ ^(local|remote)$ ]]; then
  RUN_ENV=local;
fi

if [[ ! "$RUN_TYPE" =~ ^(train|hptuning)$ ]]; then
  RUN_TYPE=train;
fi

NOW="$(date +"%Y%m%d_%H%M%S")"
JOB_PREFIX="sklearn_template"

JOB_NAME="${JOB_PREFIX}_${RUN_TYPE}_${NOW}"
JOB_DIR="gs://$BUCKET_ID/models/$JOB_NAME"
PACKAGE_PATH=trainer
MAIN_TRAINER_MODULE=$PACKAGE_PATH.task
REGION=us-central1

if [ "$RUN_TYPE" = 'hptuning' ]; then
  CONFIG_FILE=config/hptuning_config.yaml
else  # Assume `train`
  CONFIG_FILE=config/config.yaml
fi

# Specify arguments for remote (AI Platform) or local (on-premise) execution
echo "$RUN_ENV"
if [ "$RUN_ENV" = 'remote' ]; then
  RUN_ENV_ARGS="jobs submit training $JOB_NAME \
    --region $REGION \
    --config $CONFIG_FILE \
    "
else  # assume `local`
  RUN_ENV_ARGS="local train"
fi

# Specify arguments to pass to the trainer module (trainer/task.py)
TRAINER_ARGS="\
  --input $INPUT \
  "

CMD="gcloud ai-platform $RUN_ENV_ARGS \
  --job-dir $JOB_DIR \
  --package-path $PACKAGE_PATH \
  --module-name $MAIN_TRAINER_MODULE \
  -- \
  $TRAINER_ARGS \
  $EXTRA_TRAINER_ARGS \
  "

echo "Running command: $CMD"
eval "$CMD"
