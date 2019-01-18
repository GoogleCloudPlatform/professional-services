#!/bin/bash

SERVICE_ACCOUNT=bq-iam@bigquery-iam.iam.gserviceaccount.com

gcloud beta functions deploy sync_groups \
  --runtime python37 \
  --trigger-http \
  --timeout 300 \
  --service-account $SERVICE_ACCOUNT

