#!/bin/bash
# Copyright 2019 Google LLC
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

# Create GCP service account, add permissions, and download key.

set -e

# TODO(munn): make remove_quotes() function
YAML_FILE="$1"
PROJECT_ID=$(yq .pipeline_project.project_id $YAML_FILE)
PROJECT_ID="${PROJECT_ID//\"}"

USER_ID=$(yq .service_acct.creator_user_id $YAML_FILE)
USER_ID="${USER_ID//\"}"

SA_NAME=$(yq .service_acct.acct_name $YAML_FILE)
SA_NAME="${SA_NAME//\"}"

SA_DESCRIPTION="$(yq .service_acct.acct_description $YAML_FILE)"
SA_DESCRIPTION="${SA_DESCRIPTION//\"}"

SA_DISPLAY_NAME="$(yq .service_acct.acct_display_name $YAML_FILE)"
SA_DISPLAY_NAME="${SA_DISPLAY_NAME//\"}"

KEY_PATH="$(yq .service_acct.key_path $YAML_FILE)"
KEY_PATH="${KEY_PATH//\"}"

# Check if a service account with this name already exists.
existing_account=$(gcloud iam service-accounts list --filter="${SA_NAME}")
if [ -z "$existing_account" ]
then
    gcloud beta iam service-accounts create ${SA_NAME} \
    --description="${SA_DESCRIPTION//\"}" \
    --display-name="${SA_NAME//\"}"
else
    echo "There is already a service account named ${SA_NAME}.";
    exit
fi

# Create the service account key
gcloud iam service-accounts keys create ${KEY_PATH} \
  --iam-account $SA_NAME@$PROJECT_ID.iam.gserviceaccount.com

# Give user AutoML Admin privledges
gcloud projects add-iam-policy-binding $PROJECT_ID \
   --member="user:"$USER_ID \
   --role="roles/automl.admin"

# Give AutoML Editor privledges to the service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
   --member="serviceAccount:"$SA_NAME"@"$PROJECT_ID".iam.gserviceaccount.com" \
   --role="roles/automl.editor"

# TODO(michaelsherman): Why admin? Why not just reader or editor?
# Give Storage Admin privledges to the service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
 --member="serviceAccount:"$SA_NAME"@"$PROJECT_ID".iam.gserviceaccount.com" \
 --role="roles/storage.admin"

# TODO(michaelsherman): Why admin? Why not just reader or editor?
# Grant BigQuery Admin privledges to the service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
 --member="serviceAccount:"$SA_NAME"@"$PROJECT_ID".iam.gserviceaccount.com" \
 --role="roles/bigquery.admin"

# Add necessary permissions for AutoML accounts
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:custom-vision@appspot.gserviceaccount.com" \
  --role="roles/ml.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:custom-vision@appspot.gserviceaccount.com" \
  --role="roles/storage.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:custom-vision@appspot.gserviceaccount.com" \
  --role="roles/serviceusage.serviceUsageAdmin"
