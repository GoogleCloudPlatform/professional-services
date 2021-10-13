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
echo "PYTHONPATH=""${PYTHONPATH}"

PROJECT_ID=$(gcloud config get-value project)

# Please modify the following accordingly
AF_REGISTRY_LOCATION=asia-southeast1
AF_REGISTRY_NAME=mlops-vertex-kit
PIPELINE_REGION=asia-southeast1

PIPELINE_ROOT=gs://vertex_pipeline_demo_root/pipeline_root # The GCS path for storing artifacts of pipeline runs
DATA_PIPELINE_ROOT=gs://vertex_pipeline_demo_root/compute_root # The GCS staging location for custom job
GCS_OUTPUT_PATH=gs://vertex_pipeline_demo_root/datasets/training # The GCS path for storing processed data

# Setup for dataset
DATA_URI=bq://"$PROJECT_ID".vertex_pipeline_demo.banknote_authentication
DATA_REGION=asia-southeast1
# The dataset used throughout the demonstration is
# Banknote Authentication Data Set, you may change according to your needs.
# The schema should be in the format of 'field_name:filed_type;...'
DATA_SCHEMA='VWT:float;SWT:float;KWT:float;Entropy:float;Class:int'
# Instance used to test deployed model
TEST_INSTANCE='[{"VWT":3.6216,"SWT":8.6661,"KWT":-2.8073,"Entropy":-0.44699,"Class":"0"}]'
# Threshold config for model monitoring
MONITORING_CONFIG=VWT:.5,SWT:.2,KWT:.7,Entropy:.4
MONITORING_EMAIL=xxx@google.com

# Setup for training
TRAIN_IMAGE_URI=${AF_REGISTRY_LOCATION}-docker.pkg.dev/${PROJECT_ID}/${AF_REGISTRY_NAME}/training:latest
SERVING_IMAGE_URI=${AF_REGISTRY_LOCATION}-docker.pkg.dev/${PROJECT_ID}/${AF_REGISTRY_NAME}/serving:latest
# Additional arguments passed to training step
TRAIN_ARGS='{"num_leaves_hp_param_min":6,"num_leaves_hp_param_max":11,"max_depth_hp_param_min":-1,"max_depth_hp_param_max":4,"num_boost_round":300,"min_data_in_leaf":5}'
VPC_NETWORK=""
METRIC_NAME=au_prc
METRIC_THRESHOLD=0.4

# Service account to run the job
CUSTOM_JOB_SA=297370817971-compute@developer.gserviceaccount.com

PIPELINE_SPEC_PATH=./pipeline_spec/training_pipeline_job.json

python -m pipelines.training_pipeline_runner \
  --project_id "$PROJECT_ID" \
  --pipeline_region $PIPELINE_REGION \
  --pipeline_root $PIPELINE_ROOT \
  --pipeline_job_spec_path $PIPELINE_SPEC_PATH \
  --data_pipeline_root $DATA_PIPELINE_ROOT \
  --input_dataset_uri "$DATA_URI" \
  --training_data_schema ${DATA_SCHEMA} \
  --data_region $DATA_REGION \
  --gcs_data_output_folder $GCS_OUTPUT_PATH \
  --training_container_image_uri "$TRAIN_IMAGE_URI" \
  --train_additional_args "${TRAIN_ARGS}" \
  --output_model_file_name model.txt \
  --serving_container_image_uri "$SERVING_IMAGE_URI" \
  --custom_job_service_account $CUSTOM_JOB_SA \
  --hptune_region $PIPELINE_REGION \
  --hp_config_max_trials 30 \
  --hp_config_suggestions_per_request 5 \
  --vpc_network "$VPC_NETWORK" \
  --metrics_name $METRIC_NAME \
  --metrics_threshold $METRIC_THRESHOLD \
  --endpoint_machine_type n1-standard-4 \
  --endpoint_min_replica_count 1 \
  --endpoint_max_replica_count 2 \
  --endpoint_test_instances "${TEST_INSTANCE}" \
  --monitoring_user_emails $MONITORING_EMAIL \
  --monitoring_log_sample_rate 0.8 \
  --monitor_interval 3600 \
  --monitoring_default_threshold 0.3 \
  --monitoring_custom_skew_thresholds $MONITORING_CONFIG \
  --monitoring_custom_drift_thresholds $MONITORING_CONFIG \
  --enable_model_monitoring True
