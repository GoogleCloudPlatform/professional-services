#!/bin/bash

PROJECT_ID=$1
REGION=us-central1
SCHEDULE="11 * * * *"

gcloud beta scheduler jobs create http group_sync \
  --project $PROJECT_ID \
  --schedule=$SCHEDULE \
  --uri=https://$REGION-$PROJECT_ID.cloudfunctions.net/group_sync \
  --description="Synchronizes group membership between G Suite and BigQuery"

