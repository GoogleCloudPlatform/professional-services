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

# Common code used in shell scripts.

OUTPUT_DIR="outputs"
MODEL_DIR="models"
PREPROCESSING_DIR="preprocessing"
TFT_DIR="tft"
SCALE_TIER="STANDARD_1"
MODEL_NAME="recommender"
HPTUNING_CONFIG="trainer/hptuning_config.yaml"
DEFAULT_TRIAL="1"
USERNAMES_PATH="serving/test.json"

function get_project_id {
  echo "$(gcloud config list --format 'value(core.project)' 2>/dev/null)"
}

function get_date_time {
  echo "$(date +%Y%m%d%H%M%S)"
}

