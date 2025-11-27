#!/bin/sh
set -eu

echo "Authenticating with gcloud..."
gcloud auth application-default login

echo "Fetching Google Cloud project details..."
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "GCP project not set. Please run 'gcloud config set project YOUR_PROJECT_ID'"
    exit 1
fi

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
if [ -z "$PROJECT_NUMBER" ]; then
    echo "Could not retrieve project number for project $PROJECT_ID."
    exit 1
fi

SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "Ensuring service account ${SERVICE_ACCOUNT} has aiplatform.admin role..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/aiplatform.admin" --condition=None

echo "Submitting Cloud Build job for RAG corpus deployment..."
cd rag_corpus_deployment || exit 1
gcloud builds submit --config cloudbuild.yaml

echo "Cloud Build job submitted successfully."
