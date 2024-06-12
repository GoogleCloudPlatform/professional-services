#!/bin/bash

# Copyright 2023 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#         http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
 
#Set up env vars
PROJECT="$(gcloud config get-value project)"
SRC_TABLE=bigquery-public-data:ml_datasets.ulb_fraud_detection
BQ_DATASET_NAME=creditcards
BQ_SOURCE_TABLE=creditcards
ML_TABLE=creditcards_ml
DST_TABLE=$BQ_DATASET_NAME.$BQ_SOURCE_TABLE
BUCKET="gs://$PROJECT/data/credit_cards*"
REGION=europe-west4
ENDPOINT="$REGION-aiplatform.googleapis.com"

#Extract & Load
bq extract --project_id "$PROJECT" --destination_format PARQUET "$SRC_TABLE"  "$BUCKET"
bq load    --project_id "$PROJECT" --source_format=PARQUET --replace=true "$DST_TABLE" "$BUCKET" 
gsutil rm "$BUCKET"


sql_script="CREATE OR REPLACE TABLE \`${PROJECT}.${BQ_DATASET_NAME}.${ML_TABLE}\` 
AS (
    SELECT * EXCEPT(Class), CAST(Class AS FLOAT64) as Class,
      IF(ABS(MOD(FARM_FINGERPRINT(CAST(Time AS STRING)), 100)) <= 80, 'UNASSIGNED', 'TEST') AS ML_use
    FROM
      \`${PROJECT}.${BQ_DATASET_NAME}.${BQ_SOURCE_TABLE}\`
)
"

bq query --project_id "$PROJECT" --nouse_legacy_sql "$sql_script"

bq_uri="bq://${PROJECT}.${BQ_DATASET_NAME}.${ML_TABLE}"
echo "Creating Bigquery Managed Dataset: ${bq_uri}"
echo "{
  \"display_name\": \"creditcards\",
  \"metadata_schema_uri\": \"gs://google-cloud-aiplatform/schema/dataset/metadata/tabular_1.0.0.yaml\",
  \"metadata\": {
    \"input_config\": {
      \"bigquery_source\" :{
        \"uri\": \"${bq_uri}\" 
      }
    }
  }
}" > request.json


curl -X POST \
-H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
-H "Content-Type: application/json; charset=utf-8" \
-d @request.json \
"https://${ENDPOINT}/v1/projects/${PROJECT}/locations/${REGION}/datasets"
