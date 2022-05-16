# Cloud Run to BQ Sample

This sample shows how to deploy a application to Cloud Run which gets the data over REST API and inserts to BQ.

## Prerequisites
* A project
* A service account which needs to be associated with cloud run with below permissions on project
  * roles/bigquery.dataEditor
  * roles/logging.logWriter
* A service account to run CI/CD, with below permissions on project.
  * "roles/run.admin"
  * "roles/storage.admin"
* A GCR repo to store docker images

## Build
```sh
gcloud docker -- build -t <GCR_REPO>/cr-to-bq .
```
## Test Locally
```sh

# Store default credentials in docker volume
docker run -ti --name gcloud-config gcr.io/google.com/cloudsdktool/cloud-sdk gcloud auth application-default login

# Run container locally, replace dataset and table names with your dataset and table names
docker run --rm --volumes-from gcloud-config -e BQ_DATASET=person -e BQ_TABLE=person -e GCP_PROJECT=<project_id> --network=host  <GCR_REPO>/cr-to-bq

# Send HTTP Request
curl  -X POST  -H 'Content-Type: application/json' http://localhost:8080/events -d '{"Name": "Tom", "Age": 36}'

{"status":"success"}
```

## Push
```sh
gcloud docker -- push <GCR_REPO>/cr-to-bq
```

## Deploy

```sh
# Set an environment variable with your GCP Project ID
export GOOGLE_CLOUD_PROJECT=<PROJECT_ID>
export SERVICE_ACCOUNT=<CLOUD_RUN_SA>
export CR_IAMGE=<CR_IAMGE>
export DATASET=<DATASET_NAME>
export TABLE=<TABLE_NAME>

# Deploy to Cloud Run
gcloud run deploy cr-to-bq-service --image $CR_IAMGE --region us-central1 --project $GOOGLE_CLOUD_PROJECT --service-account $SERVICE_ACCOUNT \
--set-env-vars=GCP_PROJECT=$GOOGLE_CLOUD_PROJECT,BQ_DATASET=$DATASET,BQ_TABLE=$TABLE,SERVING_PORT=8080,LOG_LEVEL="INFO"
```

## CI/CD
This sample example includes a cloudbuild.yaml file, which can be directly used to run CI/CD using cloud build.
_REPO_NAME and _SA_EMAIL substituion variables present in cloudbuild.yaml can be substituted with CI/CD SA 
and GCR repo as explained in prerequisites section.
