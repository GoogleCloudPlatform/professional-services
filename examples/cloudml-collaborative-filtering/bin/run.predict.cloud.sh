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

# Convenience script for predicting locally using a model on AI Platform.
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
MODEL_VERSION="v${MODEL_OUTPUTS_DIR}_${TRIAL}"

python -m serving.make_prediction \
  --project "${PROJECT_ID}" \
  --model "${MODEL_NAME}" \
  --version "${MODEL_VERSION}" \
  --usernames "${USERNAMES_PATH}"
