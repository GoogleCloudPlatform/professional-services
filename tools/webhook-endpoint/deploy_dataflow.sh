#!/bin/bash

source WEBHOOK.env

# Deploy Template
export PROJECT=${PROJECT_ID}
export TEMPLATE_IMAGE_SPEC=gs://app-engine-webhook-app/images/pubsub-cdc-to-bigquery-image-spec.json
export TOPIC_PATH=projects/${PROJECT_ID}/topics/${TOPIC}
export SUBSCRIPTION_PATH=projects/${PROJECT_ID}/subscriptions/${SUBSCRIPTION}
export DATASET_TEMPLATE=${BQ_DATASET}
export TABLE_NAME_TEMPLATE=${BQ_TABLE_TEMPLATE}
export DEADLETTER_TABLE=${PROJECT_ID}:${DATASET_TEMPLATE}.dead_letter

gcloud beta dataflow flex-template run ${DATAFLOW_JOB_NAME} \
        --project=${PROJECT} --region=${REGION} \
        --template-file-gcs-location=${TEMPLATE_IMAGE_SPEC} \
        --parameters inputSubscription=${SUBSCRIPTION_PATH},outputDatasetTemplate=${DATASET_TEMPLATE},outputTableNameTemplate=${TABLE_NAME_TEMPLATE},outputDeadletterTable=${DEADLETTER_TABLE}

