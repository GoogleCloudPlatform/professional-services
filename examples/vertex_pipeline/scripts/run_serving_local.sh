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

# Local testing of serving program

cd "$( dirname "${BASH_SOURCE[0]}" )" || exit
DIR="$( pwd )"
SRC_DIR=${DIR}"/../"
export PYTHONPATH=${PYTHONPATH}:${SRC_DIR}
echo "PYTHONPATH=""${PYTHONPATH}"


# The dataset used throughout the demonstration is
# Banknote Authentication Data Set, you may change according to your needs.
# The schema should be in the format of 'field_name:filed_type;...'
export TRAINING_DATA_SCHEMA='VWT:float;SWT:float;KWT:float;Entropy:float;Class:int'
export MODEL_FILENAME='model.txt'

python -m images.serving.app
