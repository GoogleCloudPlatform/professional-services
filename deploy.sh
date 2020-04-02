#!/bin/bash
# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

SA_NAME="email-exports-service-account"
SVC_DESC="The service account used by the BQ email export Cloud Function"
PROJECT_ID="report-scheduling"

# Create Cloud Functions service account
gcloud iam service-accounts create $SA_NAME --description "$SVC_DESC" --project "$PROJECT_ID"
SVC_ACCOUNT_EMAIL=$(gcloud iam service-accounts list --filter="name:$SA_NAME" --format "value(email)")

CF_NAME="nnene-function"
CS_NAME="nnene-scheduler"
TOPIC_NAME="nnene-exports"
TOPIC_PATH="projects/${PROJECT_ID}/topics/nnene-exports"
SENDGRID_API_KEY="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"
SCHEDULE="00 00 * * *"

gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SVC_ACCOUNT_EMAIL" --role='roles/bigquery.admin'
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SVC_ACCOUNT_EMAIL" --role='roles/storage.objectAdmin'
gcloud projects add-iam-policy-binding $PROJECT_ID --member="serviceAccount:$SVC_ACCOUNT_EMAIL" --role='roles/iam.serviceAccountTokenCreator'

# Deploy Cloud Function and create a Scheduler job
gcloud pubsub topics create "$TOPIC_NAME"
gcloud functions deploy "$CF_NAME" --entry-point=main --trigger-topic "$TOPIC_NAME" --runtime python37 --memory "512MB" --service-account "$SVC_ACCOUNT_EMAIL" --project "$PROJECT_ID" --set-env-vars SENDGRID_API_KEY="$SENDGRID_API_KEY"
gcloud scheduler jobs create pubsub "$CS_NAME" --schedule="$SCHEDULE" --topic="$TOPIC_PATH" --message-body="bqemail" --project="$PROJECT_ID"
