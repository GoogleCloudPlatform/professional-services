#!/bin/bash

# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

cd "$( dirname "${BASH_SOURCE[0]}" )" || exit
DIR="$( pwd )"
SRC_DIR=${DIR}"/../"
export PYTHONPATH=${PYTHONPATH}:${SRC_DIR}
echo "PYTHONPATH="${PYTHONPATH}

PROJECT_ID=$(gcloud config get-value project)

# Please modify the following accordingly
PIPELINE_REGION=asia-southeast1

PIPELINE_ROOT=gs://vertex_pipeline_demo_root/pipeline_root # The GCS path for storing artifacts of pipeline runs
DATA_PIPELINE_ROOT=gs://vertex_pipeline_demo_root/compute_root # The GCS staging location for custom job
GCS_OUTPUT_PATH=gs://vertex_pipeline_demo_root/datasets/prediction # The GCS path for storing processed data
GCS_PREDICTION_PATH=gs://vertex_pipeline_demo_root/prediction # The GCS path for storing prediction results

# Setup for dataset
DATA_URI=bq://"$PROJECT_ID".vertex_pipeline_demo.banknote_authentication_features
DATA_REGION=asia-southeast1

# The endpoint resource name that hosting the target model
# You may also use target model resource name directly, in the case please use
# --model_resource_name $MODEL_RN
ENDPOINT_RN='projects/297370817971/locations/asia-southeast1/endpoints/8843521555783745536'

PIPELINE_SPEC_PATH=./pipeline_spec/batch_prediction_pipeline_job.json

python -m pipelines.batch_prediction_pipeline_runner \
  --project_id "$PROJECT_ID" \
  --pipeline_region $PIPELINE_REGION \
  --pipeline_root $PIPELINE_ROOT \
  --pipeline_job_spec_path $PIPELINE_SPEC_PATH \
  --data_pipeline_root $DATA_PIPELINE_ROOT \
  --input_dataset_uri "$DATA_URI" \
  --data_region $DATA_REGION \
  --gcs_data_output_folder $GCS_OUTPUT_PATH \
  --gcs_result_folder $GCS_PREDICTION_PATH \
  --endpoint_resource_name $ENDPOINT_RN \
  --machine_type n1-standard-8 \
  --accelerator_count 0 \
  --accelerator_type ACCELERATOR_TYPE_UNSPECIFIED \
  --starting_replica_count 1 \
  --max_replica_count 2
