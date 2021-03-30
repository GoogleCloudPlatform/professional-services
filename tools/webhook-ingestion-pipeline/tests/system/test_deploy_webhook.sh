#!/bin/bash

# Copyright 2020 Google Inc.
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

# NOTE: The Webhook App Deployment requires:
# 	- The project to exist before deployment
# 	- App Engine must be created but no service needs to be deployed


# Project Info for Testing Only
export PROJECT_ID="<project-id>"
export PROJECT_NUMBER="project-num"

export BQ_DATASET=webhook
export BQ_TABLE_TEMPLATE=webhook_data

# Build Webhook Pipeline
make build PROJECT_ID="${PROJECT_ID}" PROJECT_NUMBER="${PROJECT_NUMBER}"
echo "Sleep for 300 seconds: Dataflow deploy"
sleep 300

# Add user to BQ Admins
bq show --format=prettyjson ${PROJECT_ID}:webhook > temp.json
sed -i 's/"access": \[/"access": \[{"role": "OWNER","userByEmail": "XYZ@gmail.com"},/g' temp.json
bq update --source temp.json ${PROJECT_ID}:webhook
rm temp.json

# Send Test Data
echo "Send Data: 1003 Records"
python3 tests/system/send_data.py -p "${PROJECT_ID}" -ps 10 -r 100 -bs 10 -b 1 -s 0

# Then validate results
echo "Sleep for 300 seconds: Process Data"
sleep 300
RESULT_TABLE_COUNT=$(echo "SELECT COUNT(1) AS row_count FROM ${BQ_DATASET}.${BQ_TABLE_TEMPLATE};" | bq --project_id="${PROJECT_ID}" query | grep '|' | tail -n 1 | awk '{print $2;}')
echo "*** Table Row Count: Expected 1003 --> Found ${RESULT_TABLE_COUNT}"

# Destroy Deployment
make destroy PROJECT_ID="${PROJECT_ID}" PROJECT_NUMBER="${PROJECT_NUMBER}"

# Remove tables which were created by Dataflow during the test
bq rm -f --project_id="${PROJECT_ID}" webhook.webhook_data
bq rm -f --project_id="${PROJECT_ID}" webhook.errors
