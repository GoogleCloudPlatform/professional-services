#!/bin/bash

PROJECT_ID=$1
REGION=us-central1
SERVICE_ACCOUNT_USERNAME=bq-iam
SERVICE_ACCOUNT=$SERVICE_ACCOUNT_USERNAME@$PROJECT_ID.iam.gserviceaccount.com

gcloud beta functions deploy sync_groups \
  --project $PROJECT_ID \
  --region $REGION \
  --runtime python37 \
  --trigger-http \
  --timeout 300 \
  --service-account $SERVICE_ACCOUNT

