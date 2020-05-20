#!/bin/bash

# NOTE: The Webhook App Deployment requires:
# 	- The project to exist before deployment
# 	- App Engine must be created but no service needs to be deployed

# Build Source for Webhook
source WEBHOOK.env

# Build Webhook Pipeline
./build.sh

# Send Test Data
echo "Send Data: 1003 Records"
python3 tests/send_data.py

# Wait for Results to Load into BigQuery
# Then validate results
export _SLEEP_SECS=300
echo "Sleep for 300 seconds"
sleep 300
export RESULT_TABLE_COUNT=$(echo "SELECT COUNT(1) AS row_count FROM ${BQ_DATASET}.${BQ_TABLE_TEMPLATE};" | bq query | grep '|' | tail -n 1 | awk '{print $2;}')
echo "*** Table Row Count: Expected 1003 --> Found ${RESULT_TABLE_COUNT}"

# Destroy Deployment
./tear_down.sh

