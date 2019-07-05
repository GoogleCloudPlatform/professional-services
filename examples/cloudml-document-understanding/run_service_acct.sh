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

PROJECT_ID="munn-sandbox"
USERID_DOMAIN="munn@google.com"

SA_NAME="doc-demo-service-acct"
SA_DESCRIPTION="service_account_for_doc_understanding_demo"
SA_DISPLAY_NAME="Doc_Demo_service_account"


gcloud beta iam service-accounts create $SA_NAME \
    --description=$SA_DESCRIPTION \
    --display-name=$SA_DISPLAY_NAME

gcloud iam service-accounts keys create ./keys/key.json \
  --iam-account $SA_NAME@$PROJECT_ID.iam.gserviceaccount.com

gcloud projects add-iam-policy-binding $PROJECT_ID \
   --member="user:"$USERID_DOMAIN \
   --role="roles/automl.admin"
gcloud projects add-iam-policy-binding $PROJECT_ID \
   --member="serviceAccount:"$SA_NAME"@"$PROJECT_ID".iam.gserviceaccount.com" \
   --role="roles/automl.editor"