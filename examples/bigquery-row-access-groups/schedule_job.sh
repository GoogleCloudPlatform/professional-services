#!/bin/bash

PROJECT_ID=$1
REGION=us-central1

gcloud beta scheduler jobs create http group_sync \
  --project cmb-playground \
  --schedule="11 * * * *" \
  --uri=https://$REGION-$PROJECT_ID.cloudfunctions.net/group_sync \
  --description="Synchronizes group membership between G Suite and BigQuery"

