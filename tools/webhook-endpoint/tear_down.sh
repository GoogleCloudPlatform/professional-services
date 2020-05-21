#!/bin/bash

# Build Source for Webhook
source WEBHOOK.env

# Destroy Deployment
cd terraform/
bq rm -f webhook.webhook_data
bq rm -f ${BQ_DEADLETTER}
terraform destroy -auto-approve

cd ..

# Tear Down Dataflow
export DF_JOBS=$(gcloud dataflow jobs list --status=active --region=${REGION} | grep 'webhook-job-' | awk '{print $1;}')
gcloud dataflow jobs cancel ${DF_JOBS} --region=${REGION}
