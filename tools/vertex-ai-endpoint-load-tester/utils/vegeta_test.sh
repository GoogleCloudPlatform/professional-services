#!/bin/bash
# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# declare input/other variables
ENDPOINT_ID=$1
PROJECT_ID=$4
REQUEST_FILE=$5
DURATION=$2
RATE=$3
CURR_DIR="$(dirname "$0")"
TOKEN="$(gcloud auth application-default print-access-token)"
URL="https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/endpoints/${ENDPOINT_ID}:predict?access_token=${TOKEN}"

# run vegeta tool for load test
echo "POST ${URL}" | "$CURR_DIR"/vegeta attack -header "Content-Type: application/json" -body "${REQUEST_FILE}" -duration="${DURATION}"s -rate="${RATE}" | "$CURR_DIR"/vegeta report -type=json

# END
