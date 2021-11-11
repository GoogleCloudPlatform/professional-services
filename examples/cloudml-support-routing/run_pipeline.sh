#!/bin/bash
# Copyright 2020 Google Inc. All Rights Reserved.
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

# Run Python scripts in sequence for:
#   create features (f)
#   train (t)
#   predict (p)
# 
# Args:
#   CONFIG_PATH: Path of pipeline YAML config file, relative to project root.
#   MODE: 'f', 't', and/or 'p', or some combination thereof, indicating
#     pipeline phases to run.

set -e

CONFIG_PATH=$1
MODE=$2

if [[ $# -lt 2 ]]
then
  echo "Expected positonal args CONFIG_PATH and MODE, only received $# args."
  exit
fi

echo "Running with MODE $MODE."

if [[ $MODE =~ "f" ]]
then
  python scripts/create_features.py \
  --config_path="$CONFIG_PATH"
fi
  
if [[ $MODE =~ "t" ]]
then
  python scripts/train.py \
  --config_path="$CONFIG_PATH"
fi

if [[ $MODE =~ "p" ]]
then
  python scripts/predict.py \
  --config_path="$CONFIG_PATH"
fi
