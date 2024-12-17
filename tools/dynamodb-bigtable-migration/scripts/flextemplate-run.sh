#!/bin/bash
set -eE

script_dir=$(dirname "$0")

# shellcheck source=/dev/null
source "${script_dir}/.env"

COMMAND=${1:?"command  |DYNAMO-BT  is required as argument \$1"}

# shellcheck disable=SC1073
JOB_NAME=$(echo "${COMMAND}-dataload-$(date +%Y%m%d-%H%M%S)" | tr '[:upper:]' '[:lower:]')

function dynamodb_to_bigtable() {
   echo "Loading DynamoDB data from Cloud Storage to Bigtable using job:${JOB_NAME}"

gcloud dataflow flex-template run "${JOB_NAME}" \
    --template-file-gcs-location "${FLEX_TEMPLATE_SPEC_FILE_PATH}" \
    --project "${PROJECT_ID}"  --region "${REGION}" \
    --disable-public-ips \
    --staging-location "${STAGING_LOCATION}" \
    --temp-location "${TEMP_LOCATION}" \
    --parameters inputFilePath="${INPUT_FILEPATH}" \
    --parameters bigtableProjectId="${PROJECT_ID}" \
    --parameters bigtableInstanceId="${BIGTABLE_INSTANCE_ID}" \
    --parameters bigtableRowKey="${BIGTABLE_ROW_KEY}" \
    --parameters bigtableTableId="${BIGTABLE_TABLE_ID}" \
    --parameters bigtableColumnFamily="${BIGTABLE_COL_FAMILY}"

}

case "$COMMAND" in
  "DYNAMO-BT")
    dynamodb_to_bigtable
    ;;
  help) # Changed this line
     echo "usage: sh flextemplate-run.sh <command> where command can be one of the following:
       DYNAMO-BT : Loads data from DynamoDB to Bigtable
  "
   ;;
  *) # Changed this line
     echo "usage: sh flextemplate-run.sh <command> where command can be one of the following:
       DYNAMO-BT : Loads data from DynamoDB to Bigtable
  "
   ;;
esac