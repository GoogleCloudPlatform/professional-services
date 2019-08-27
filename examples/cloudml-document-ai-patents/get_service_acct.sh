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

# TODO(michaelsherman): Use yq to parse config, require yaml file as input.
# TODO(michaelsherman): Make sure this YAML reading is working.
local YAML_FILE="$1"

local PROJECT_ID="yq .pipeline_project.project_id $1"
YAML_FILE="$1"
PROJECT_ID="$(yq .pipeline_project.project_id $YAML_FILE)"
USER_ID="$(yq .service_acct.creator_user_id $YAML_FILE)"
SA_NAME="$(yq .service_acct.name $YAML_FILE)"
SA_DESCRIPTION="$(yq .service_acct.description $YAML_FILE)"
SA_DISPLAY_NAME="$(yq .service_acct.display_name $YAML_FILE)"

# TODO(michaelsherman): need to check if patent-demo-service-acct exits already. 
# If so stop and raise an error.
gcloud beta iam service-accounts create $SA_NAME \
    --description=$SA_DESCRIPTION \
    --display-name=$SA_DISPLAY_NAME

# Create the service account key
gcloud iam service-accounts keys create ./keys/service-acct.json \
  --iam-account $SA_NAME@$PROJECT_ID.iam.gserviceaccount.com

# TODO(michaelsherman): Why both automl.admin and .editor? Editor alone ok?
# Give AutoML Editor privledges to the service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
   --member="user:"$USERID_DOMAIN \
   --role="roles/automl.admin"

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