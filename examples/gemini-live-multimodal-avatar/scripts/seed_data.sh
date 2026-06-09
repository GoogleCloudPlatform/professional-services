#!/bin/bash
# Copyright 2026 Google LLC
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

set -e

echo "================================================="
echo "  Seeding Vertex AI Search Data Store"
echo "================================================="

# 1. Ensure we are logged in and have an access token
echo "Checking authentication..."
TOKEN=$(gcloud auth application-default print-access-token)
if [ -z "$TOKEN" ]; then
    echo "Error: Could not get Google Cloud access token. Please run 'gcloud auth application-default login'."
    exit 1
fi

# 2. Extract configuration from Terraform outputs
echo "Extracting configuration from Terraform..."
cd infra || exit 1
PROJECT_ID=$(terraform output -raw vertex_project_id)
LOCATION=$(terraform output -raw vertex_search_location)
DATA_STORE_ID=$(terraform output -raw vertex_data_store_id)
# Extracting the bucket URL (e.g. gs://bucket-name)
BUCKET_URL=$(terraform output -raw data_bucket_url)
cd .. || exit 1

if [ -z "$PROJECT_ID" ] || [ -z "$LOCATION" ] || [ -z "$DATA_STORE_ID" ] || [ -z "$BUCKET_URL" ]; then
    echo "Error: Could not read necessary outputs from Terraform. Did you run 'terraform apply' first?"
    exit 1
fi

echo "Project ID:    $PROJECT_ID"
echo "Location:      $LOCATION"
echo "Data Store ID: $DATA_STORE_ID"
echo "Bucket URL:    $BUCKET_URL"
echo ""

# 3. Upload data to GCS
echo "Uploading data from ./data/ to $BUCKET_URL ..."
# Using rsync to ensure the bucket exactly matches the local folder
gcloud storage rsync -r ./data/ "$BUCKET_URL/"
echo "Upload complete."
echo ""

# 4. Trigger Data Import in Vertex AI Search via REST API
echo "Triggering data import to Vertex AI Search..."

API_ENDPOINT="https://discoveryengine.googleapis.com/v1/projects/$PROJECT_ID/locations/$LOCATION/collections/default_collection/dataStores/$DATA_STORE_ID/branches/default_branch/documents:import"

# We use the GCS wildcard to import all files from the root of the bucket
PAYLOAD=$(cat <<EOF
{
  "gcsSource": {
    "inputUris": ["$BUCKET_URL/*"],
    "dataSchema": "content"
  },
  "reconciliationMode": "INCREMENTAL"
}
EOF
)

# Note: dataSchema "custom" handles unstructured data like PDFs.
RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-goog-user-project: $PROJECT_ID" \
  "$API_ENDPOINT" \
  -d "$PAYLOAD")

echo "Import Job Response:"
if command -v jq >/dev/null 2>&1; then
    echo "$RESPONSE" | jq .
elif command -v python3 >/dev/null 2>&1; then
    echo "$RESPONSE" | python3 -m json.tool
else
    echo "$RESPONSE"
fi

echo ""
echo "================================================="
echo "Import job triggered successfully!"
echo "Note: This is an asynchronous operation. You can monitor"
echo "the import status in the Google Cloud Console:"
echo "https://console.cloud.google.com/gen-app-builder/data-stores/$DATA_STORE_ID/activity?project=$PROJECT_ID"
echo "================================================="
