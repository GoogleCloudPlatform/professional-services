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

# Local testing of training program

cd "$( dirname "${BASH_SOURCE[0]}" )" || exit
DIR="$( pwd )"
SRC_DIR=${DIR}"/../"
export PYTHONPATH=${PYTHONPATH}:${SRC_DIR}
echo "PYTHONPATH=""${PYTHONPATH}"

PROJECT_ID=$(gcloud config get-value project)

# The dataset used throughout the demonstration is
# Banknote Authentication Data Set, you may change according to your needs.
# The schema should be in the format of 'field_name:filed_type;...'
DATA_SCHEMA='VWT:float;SWT:float;KWT:float;Entropy:float;Class:int'
DATA_PATH=gs://mldataset-fantasy/banknote_authentication.csv
LABEL_FIELD=Class

# Please modify the following accordingly
VIZER_REGION=asia-southeast1

python -m images.training.app \
  --training_data_uri=$DATA_PATH \
  --training_data_schema=$DATA_SCHEMA \
  --label=$LABEL_FIELD \
  --perform_hp \
  --hp_config_gcp_project_id="${PROJECT_ID}" \
  --hp_config_gcp_region=$VIZER_REGION \
  --hp_config_suggestions_per_request=5 \
  --hp_config_max_trials=20 \
  --num_boost_round=300 \
  --min_data_in_leaf=5 \
  --num_leaves_hp_param_min=6 \
  --num_leaves_hp_param_max=11 \
  --max_depth_hp_param_min=-1 \
  --max_depth_hp_param_max=4
