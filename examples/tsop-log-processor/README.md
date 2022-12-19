## TSOP Log Processor
Currently Transfer Service for On Prem writes transfer logs to GCS objects but not to cloud logging.
It puts the logs in same bucket where it transfer objects. This cloud function reads logs from
GCS object and writes to cloud logging. Cloud Function gets invoked via pub/sub as soon as logs are created
in bucket.

### Setup
```
export BUCKET_NAME=<bucket-name>
export PROJECT_ID=<project-id>
export LOCATION=<region>
export NETWORK_PROJECT=<network_project> # Used only if Cloud Function is using VPC Connector
export VPC_CONNECTOR=<vpc connector name>

# Create a pub sub topic for cloud function, where events will be pushed when transfer logs are created in the bucket.
# Events will be generated only for objects under folder storage-transfer/. TSOP service writes transfer logs under this folder in a bucket.
gsutil notification create -p storage-transfer/  -t projects/$PROJECT_ID/topics/tsop-transfer-logs-objects  -f json -e OBJECT_FINALIZE gs://$BUCKET_NAME

# Create a service account which will be used by the cloud function for writing logs
gcloud iam service-accounts create tsop-logging-cf-sa --display-name="Service account used by cloud function for TSOP logging" --project $PROJECT_ID
export CF_SA="tsop-logging-cf-sa@$PROJECT_ID.iam.gserviceaccount.com"

# Assign permissions to the cloud function service account for reading the GCS object and writing its content to logs.
gcloud projects add-iam-policy-binding $PROJECT_ID --member='serviceAccount:'$CF_SA --role="roles/storage.objectViewer"
gcloud projects add-iam-policy-binding $PROJECT_ID --member='serviceAccount:'$CF_SA --role="roles/logging.logWriter"


# Assign permissions to the cloud function  service account in order to use vpc connector.
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
gcloud projects add-iam-policy-binding $NETWORK_PROJECT --member=serviceAccount:service-$PROJECT_NUMBER@gcf-admin-robot.iam.gserviceaccount.com --role=roles/vpcaccess.user


# Deploy Cloud Function
gcloud functions deploy tsop-logs-processor --runtime python37 \
--trigger-topic "tsop-transfer-logs-objects" --entry-point "read_pubsub" \
--service-account "tsop-logging-cf-sa@$PROJECT_ID.iam.gserviceaccount.com" \
--region $LOCATION --vpc-connector "projects/$NETWORK_PROJECT/locations/$LOCATION/connectors/$VPC_CONNECTOR" \
--ingress-settings internal-only --egress-settings all --project $PROJECT_ID
```
