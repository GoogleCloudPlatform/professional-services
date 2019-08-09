#!/bin/bash
# Copyright 2018 Google LLC
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
#
# Shell script to create service account, add permissions and download key.

# TODO: Read from Yaml File
PROJECT_ID="munn-sandbox"
USERID_DOMAIN="munn@google.com"

SA_NAME="patent-demo-service-acct"
SA_DESCRIPTION="Service-account-for-doc-understanding-demo"
SA_DISPLAY_NAME="Patent-Demo-Service-Account"

# TODO: need to check if patent-demo-service-acct exits already. 
# If so, delete and recreate, or just add necessary permissions
gcloud beta iam service-accounts create $SA_NAME \
    --description=$SA_DESCRIPTION \
    --display-name=$SA_DISPLAY_NAME

# Create the service account key
gcloud iam service-accounts keys create ./keys/service-acct.json \
  --iam-account $SA_NAME@$PROJECT_ID.iam.gserviceaccount.com

# Give AutoML Editor privledges to the service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
   --member="user:"$USERID_DOMAIN \
   --role="roles/automl.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID \
   --member="serviceAccount:"$SA_NAME"@"$PROJECT_ID".iam.gserviceaccount.com" \
   --role="roles/automl.editor"

# Give Storage Admin privledges to the service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
 --member="serviceAccount:"$SA_NAME"@"$PROJECT_ID".iam.gserviceaccount.com" \
 --role="roles/storage.admin"

# Grant BigQuery Admin privledges to the service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
 --member="serviceAccount:"$SA_NAME"@"$PROJECT_ID".iam.gserviceaccount.com" \
 --role="roles/bigquery.admin"