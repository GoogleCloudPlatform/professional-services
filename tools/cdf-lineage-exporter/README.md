# CDAP Lineage Export to Google Cloud Storage
This is a simple application to export the Dataset lineage info in the
[CDAP Lineage API](https://docs.cdap.io/cdap/current/en/reference-manual/http-restful-api/metadata.html#H2481).


## Pre-reqs
- Python >= 3.7 
- Google Cloud SDK
- [Optional] Docker >= 19.03.5

## Local Setup
```
python3 -m venv .venv
source .venv/bin/activate
pip3 install -r cdap_lineage_export/requirements.txt
gcloud auth application-default login
```

## Local CLI Usage
```bash
usage: main.py [-h] --project PROJECT --api_endpoint API_ENDPOINT
                         --bucket BUCKET [--start_ts START_TS]
                         [--end_ts END_TS] [--log {ERROR,INFO,WARN,DEBUG}]

Export CDAP Lineage information to GCS bucket

optional arguments:
  -h, --help            show this help message and exit
  --project PROJECT, -p PROJECT
                        GCP Project ID
  --api_endpoint API_ENDPOINT, -a API_ENDPOINT
                        CDAP API endpoint. For Data Fusion this can be
                        retrieved with: gcloud beta data-fusion instances
                        describe --location=${REGION}
                        --format='value(apiEndpoint)' ${INSTANCE_NAME}
  --bucket BUCKET, -b BUCKET
                        Destination GCS Bucket for lineage loading
  --start_ts START_TS, -s START_TS
                        Starting time-stamp of lineage (inclusive), in
                        seconds. Supports now, now-1h, etc. syntax
  --end_ts END_TS, -e END_TS
                        Ending time-stamp of lineage (inclusive), in seconds.
                        Supports now, now-1h, etc. syntax
  --log {ERROR,INFO,WARN,DEBUG}
                        Logging level, defaults to INFO

        Example Usage: 

        export  PROJECT='your-gcp-project'
        export  BUCKET='cdap_lineage_export_bucket'
        export  REGION='us-central1'
        export  INSTANCE_NAME='cdf-instance'
        export  CDAP_API_ENDPOINT=$(gcloud beta data-fusion instances describe --location=${REGION} --format='value(apiEndpoint)' ${INSTANCE_NAME})

        python3 main.py \
          --api_endpoint='${CDAP_API_ENDPOINT}' \
          --project='${PROJECT}' \
          --bucket=${BUCKET}
```

Example: 

```bash
# Activate virtual environment from Local Setup
source .venv/bin/activate #

# Set 
export PROJECT="myproject"
gcloud config set project ${PROJECT}
export BUCKET="my_cdap_lineage_bucket"
export REGION="us-central1"
export INSTANCE_NAME="private-cdf-instance"
export CDAP_API_ENDPOINT=$(gcloud beta data-fusion instances describe --location=${REGION} --format="value(apiEndpoint)" ${INSTANCE_NAME})
python3 cdap_lineage_export/main.py \
  --api_endpoint=${CDAP_API_ENDPOINT} \
  --project=${PROJECT} \
  --bucket=${BQ_DATASET} \
  --start_ts=now-1000d \
  --end_ts=now
```

## Deploying as Cloud Function
We can easily deploy this as a Cloud Function.


### Deployment Methods

### Google Cloud SDK

```bash
gcloud functions deploy cdap_lineage_export \
  --region="us-central1" \
  --trigger-http \
  --runtime="python37" \
  --source="./cdap_lineage_export" \
  --entry-point="handle_http" 
```

### Terraform
Note `cloudfunctions.googleapis.com` does not support end user credentials this *must* be run with a service account.
This module requires terraform >= 0.12

#### Set Your Terraform Variables
You can do this by editing the `terraform.tfvars.example` file with the appropriate values and renaming to `terraform.tfvars` (dropping the `.example`).

#### Preparing a zip archive
```bash
zip -r cdap_lineage_export.zip cdap_lineage_export/
```

#### Spinning up the resources
```bash
terraform init
terraform apply
```

## Roadmap
- [x] Add dump to GCS
- [x] Wrap in cloud function / deploy w/ terraform
- [x] Add Terraform script to deploy this cloud function with custom SA with minimum permissions.
- [] Add another cloud function / CLI tool for exporting all lineage for a specific namespace /  applicaiton rather than everything
- [] Add Field level lineage  
- [] Grab Plugin Version information from pipeline json configs

