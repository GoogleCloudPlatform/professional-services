#!/bin/bash

#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.

# shellcheck disable=SC2086,SC2001


# Integration testing:
# 1. Prepare GCP test resources
# 2. Run the job from the deployed flex template
# 2. Check periodically for job status from the Dataflow API
# 3. If the job passed, check the tables counts against expected
# 4. Fail/Pass the integration test based on the test query results

#TODO:
# * convert to Python script
# * use Terraform to create/destroy GCP resources and test the TF module as well

# exit script when errors occur
set -e

RUN_ID="$(date +%Y%m%d_%H%M%S)"
DATASET="ml_preproc_integration_test_${RUN_ID}"
#replace '_' with '-' for Dataflow job name
JOB_NAME=${DATASET//_/-}
GCS_BUCKET="gs://${DATASET}"
LOCAL_INPUT_PATH="data/integration_test_input.csv"
GCS_INPUT_PATH="${GCS_BUCKET}/input/*"
RESULTS_TABLE="${DATASET}.results"
ERRORS_TABLE="${DATASET}.errors"

TEST_QUERY="WITH r AS (
SELECT CASE WHEN COUNT(1) = 2 THEN TRUE ELSE FALSE END AS flag
FROM ${RESULTS_TABLE}
),
e AS (
SELECT CASE WHEN COUNT(1) = 1 THEN TRUE ELSE FALSE END AS flag
FROM ${ERRORS_TABLE}
)
SELECT r.flag AND e.flag FROM e, r"

echo "Preparing GCP test resources.."
gcloud config set project "${GCP_PROJECT}"
gcloud storage buckets create --default-storage-class=standard --location="${REGION}" "${GCS_BUCKET}"
gcloud storage cp "${LOCAL_INPUT_PATH}" "${GCS_BUCKET}/input/"
#replace with terraform script and pass the dataset as var
bq mk --location "${REGION}" "${DATASET}"
bq mk --table "${RESULTS_TABLE}" schema/ml_preproc_results.json
bq mk --table "${ERRORS_TABLE}" schema/ml_preproc_errors.json
echo "Preparing GCP test resources complete."

echo "Running dataflow flex template with params:
job_name=${JOB_NAME}
project=${GCP_PROJECT}
template-file-gcs-location=${TEMPLATE_GCS_LOCATION}
input-csv=${GCS_INPUT_PATH}
results-bq-table=${GCP_PROJECT}:${RESULTS_TABLE}
errors-bq-table=${GCP_PROJECT}:${ERRORS_TABLE}
setup_file=${SETUP_FILE}
"
JOB_ID_LINE=$(gcloud dataflow flex-template run "${JOB_NAME}" \
  --project="${GCP_PROJECT}" \
  --region="${REGION}" \
  --template-file-gcs-location "${TEMPLATE_GCS_LOCATION}" \
  --parameters input-csv="${GCS_INPUT_PATH}"  \
  --parameters results-bq-table="${GCP_PROJECT}:${RESULTS_TABLE}" \
  --parameters errors-bq-table="${GCP_PROJECT}:${ERRORS_TABLE}" \
  --parameters setup_file="${SETUP_FILE}" | grep 'id:')

JOB_ID=$(echo $JOB_ID_LINE | sed -e "s/^id://")

# Dataflow service job status.
SUCCESS_JOB_STATUS=JOB_STATE_DONE
FAILED_JOB_STATUS=JOB_STATE_FAILED

# Check periodically for job status (Success or Failure)
while :; do
  CURRENT_JOB_STATUS_LINE=$(gcloud dataflow jobs describe $JOB_ID --region=$REGION | grep 'currentState:')
  CURRENT_JOB_STATUS=$(echo "${CURRENT_JOB_STATUS_LINE}" | sed -e "s/^currentState: //")
  echo "JobID ${JOB_ID} current status = ${CURRENT_JOB_STATUS} .."
  if [ "${CURRENT_JOB_STATUS}" = "${SUCCESS_JOB_STATUS}" ]; then
    echo "JobID ${JOB_ID} finished successfully."
    break
  elif [ "${CURRENT_JOB_STATUS}" = "${FAILED_JOB_STATUS}" ]; then
    echo "ERROR: JobID ${JOB_ID} failed."
    exit 1
    break
  fi
  sleep 60s
done

echo "Running test query: ${TEST_QUERY}"
QUERY_RESULT=$(bq query --use_legacy_sql=false "${TEST_QUERY}")

TEST_RESULT=$(echo "${QUERY_RESULT}" | grep 'true')
TEST_PASSED_FLAG='| true |'
TEST_FAILED_FLAG='| false |'

#check job results against expected
if [ "${TEST_RESULT}" = "${TEST_PASSED_FLAG}" ]; then
  echo "Integration test data check passed successfully."
elif [ "${TEST_RESULT}" = "${TEST_FAILED_FLAG}" ]; then
  echo "ERROR: Integration test data check failed. Check BigQuery dataset ${DATASET} for results."
  exit 1
else
  echo "ERROR Integration test data check failed. Test Query returned: ${QUERY_RESULT}."
  exit 1
fi

# cleanup
bq rm -f "${RESULTS_TABLE}"
bq rm -f "${ERRORS_TABLE}"
bq rm -f "${DATASET}"

echo "Cleanup complete."
