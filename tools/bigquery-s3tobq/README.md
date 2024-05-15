# Description
This is the codebase for S3 to BQ migration tool.

# Setting up

Please point the cloud configuration files to respective environment variable:

## Step 1: Set Environment Variable

```bash
$export GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcp_config
$export AWS_SECRET_ACCESS_KEY=<secret_key>
$export AWS_ACCESS_KEY_ID=<key_id>
```

## Step 2: Setup Cloud Composer environment
### Step 2.1: Bind the default service account iam policy:
```bash
$gcloud iam service-accounts add-iam-policy-binding \
    [Project-Number]-compute@developer.gserviceaccount.com \
    --member serviceAccount:service-[Project-Number]@cloudcomposer-accounts.iam.gserviceaccount.com \
    --role roles/composer.ServiceAgentV2Ext
```

### Step 2.2: Create the environment

```bash
$gcloud composer environments create <env-name> \
    --location <loc> \
```

### Step 2.3: Upload DAG
```bash
$gcloud composer environments storage dags import \
--environment <env-name>  --location <loc> \
--source ./core/composer/bq_dag.py
```

## Step 3: Write a config file

A sample configuration file looks like:

```yaml
input:
  source: s3://s3-to-bq-testing/*
output:
  project_id: s3tobq
  dataset_name: test_dataset
  dataset_location: asia-northeast1
  table_name: test_final_table
  table_format:
    fields:
          - { name: "location", type: "STRING"}
          - { name: "name", type: "STRING", mode: "REQUIRED"}
          - { name: "age", type: "INTEGER"}
  intermediate_table_name: "test_table"
  SQL: "SELECT * FROM test_dataset.test_table"
```

## Step 4: Deploy the container

To deploy the Cloud Run container:

```bash
$cd core
$gcloud builds submit --tag gcr.io/<PROJECT_ID>/<service-name>
$gcloud run deploy <service-name> \
     --image gcr.io/<PROJECT_ID>/<service-name> \
     --allow-unauthenticated
```

## Step 5: Setup the GCS Trigger

### Step 5.1: Setup Permissions and IAM
```bash
$gcloud projects add-iam-policy-binding 	[PROJECT_ID] \
    --member=serviceAccount:[PROJECT_NUMBER]-compute@developer.gserviceaccount.com \
    --role=roles/eventarc.eventReceiver

$gcloud projects add-iam-policy-binding 	[PROJECT_ID] \
    --member=serviceAccount:service-[PROJECT_NUMBER]@gcp-sa-pubsub.iam.gserviceaccount.com \
    --role=roles/iam.serviceAccountTokenCreator

SERVICE_ACCOUNT="$(gsutil kms serviceaccount -p [PROJECT_ID])"

$gcloud projects add-iam-policy-binding [PROJECT_ID] \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role='roles/pubsub.publisher'
```

### Step 5.2: Create the trigger

```bash
$gcloud eventarc triggers create <trigger-name> \
    --destination-run-service=<service-name> \
    --destination-run-region=<loc> \
    --event-filters="type=google.cloud.storage.object.v1.finalized" \
    --event-filters="bucket=<intermediate-gcs-bucket-name>" \
    --service-account=[PROJECT_NUMBER]-compute@developer.gserviceaccount.com \
    --location <loc>
```

# Known Limitations

- We only support Cloud Composer 2.
- This took currently only supports files with 1024.00K characters, including comments and white space characters.
