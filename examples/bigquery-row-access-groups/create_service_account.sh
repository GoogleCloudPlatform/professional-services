#!/bin/bash

PROJECT_ID=$1
SERVICE_ACCOUNT_USERNAME=bq-iam
SERVICE_ACCOUNT=$SERVICE_ACCOUNT_USERNAME@$PROJECT_ID.iam.gserviceaccount.com

gcloud iam service-accounts create --project $PROJECT_ID \
        $SERVICE_ACCOUNT_USERNAME \
        --display-name "BigQuery-IAM integration service account"

gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member serviceAccount:$SERVICE_ACCOUNT \
      --role roles/bigquery.user

gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member serviceAccount:$SERVICE_ACCOUNT \
      --role roles/iam.serviceAccountTokenCreator

