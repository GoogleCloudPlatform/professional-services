## Dataflow Python Flex Template

This example contains a sample Dataflow job which reads a XML file and inserts the records to BQ table.
It explains how to create Flex template and run it in a restricted environment where there is no 
internet connectivity to dataflow launcher or worker nodes. It also run dataflow template on shared VPC.
Example also contains a DAG which can be used to trigger Dataflow job from composer. It also demonstrates
how we can use cloudbuild to implement CI/CD for this dataflow job.

There are two docker files in the repo, the Dockerfile present at the root of directory is to create a image
with pre-installed dependencies required for workers to run the job. This image is used by worker at job run time to
avoid dependency downloading, its helpful in scenarios where workers dont have internet connectivity.

Another Dockerfile in directory `df-sample-xml-to-bq` creates an image to be used by launcher in order to launch the
dataflow job.

### Prerequisites

This example assumes Project, Network, DNS and Firewalls has already been setup.

#### Export Variables
```
export PROJECT_ID=<project_id>
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
export HOST_PROJECT_ID=<HOST_PROJECT_ID>
export INPUT_BUCKET_NAME=pw-df-input-bkt
export STAGING_BUCKET_NAME=pw-df-temp-bkt
export LOCATION=us-central1
export BQ_DATASET=bqtoxmldataset
export NETWORK=shared-vpc
export SUBNET=bh-subnet-usc1
export REPO=dataflowf-image-repo
export DF_WORKER_SA=dataflow-worker-sa@$PROJECT_ID.iam.gserviceaccount.com
```

#### Setup IAM
```
# Create service account for dataflow workers and launchers
gcloud iam service-accounts create dataflow-worker-sa --project=$PROJECT_ID

# Assign dataflow worker permissions
gcloud projects add-iam-policy-binding $PROJECT_ID --member "serviceAccount:dataflow-worker-sa@$PROJECT_ID.iam.gserviceaccount.com" --role roles/dataflow.worker

# Assign Object viewer permissions in order to read the data from cloud storage
gcloud projects add-iam-policy-binding $PROJECT_ID --member "serviceAccount:dataflow-worker-sa@$PROJECT_ID.iam.gserviceaccount.com" --role roles/storage.objectViewer

# Assign Object viewer permissions in order to Create temp files cloud storage
gcloud projects add-iam-policy-binding $PROJECT_ID --member "serviceAccount:dataflow-worker-sa@$PROJECT_ID.iam.gserviceaccount.com" --role roles/storage.objectCreator

# Assign Service Account User permissions
gcloud projects add-iam-policy-binding $PROJECT_ID --member "serviceAccount:dataflow-worker-sa@$PROJECT_ID.iam.gserviceaccount.com" --role roles/iam.serviceAccountUser

# Assign BigQuery job user permissions
gcloud projects add-iam-policy-binding $PROJECT_ID --member "serviceAccount:dataflow-worker-sa@$PROJECT_ID.iam.gserviceaccount.com" --role roles/bigquery.jobUser

# Assign bigquery data editor permissions
gcloud projects add-iam-policy-binding $PROJECT_ID --member "serviceAccount:dataflow-worker-sa@$PROJECT_ID.iam.gserviceaccount.com" --role roles/bigquery.dataEditor

# Assign Artifactory Reader Permissions
gcloud projects add-iam-policy-binding $PROJECT_ID --member "serviceAccount:dataflow-worker-sa@$PROJECT_ID.iam.gserviceaccount.com" --role roles/artifactregistry.reader

# Assign network user permissions on Host project, this is needed only if dataflow workers will be using shared VPC
gcloud projects add-iam-policy-binding $HOST_PROJECT_ID --member "serviceAccount:service-$PROJECT_NUMBER@dataflow-service-producer-prod.iam.gserviceaccount.com" --role roles/compute.networkUser
```

#### Setup Cloud Storage
```
# Create Cloud Storage bucket for input data
gcloud storage buckets create gs://$INPUT_BUCKET_NAME --location $LOCATION --project $PROJECT_ID

# Create a bucket for dataflow staging and temp locations
gcloud storage buckets create gs://$STAGING_BUCKET_NAME --location $LOCATION --project $PROJECT_ID

gsutil iam ch serviceAccount:dataflow-worker-sa@$PROJECT_ID.iam.gserviceaccount.com:roles/storage.legacyBucketWriter gs://$STAGING_BUCKET_NAME
```

#### Create BQ Dataset
```
bq --location=$LOCATION mk --dataset $PROJECT_ID:$BQ_DATASET
```

#### Create ARtifactory registry
```
gcloud  artifacts  repositories create $REPO --location $LOCATION --repository-format docker --project $PROJECT_ID
```

### Build Templates

#### Build and Push Docker Images for template
```
# Build Base Image, all packages will be used from this image when dataflow job runs
docker build -t $LOCATION-docker.pkg.dev/$PROJECT_ID/$REPO/dataflow-2.40-base:dev .

# Build Image used by launcher to launch the Dataflow job
cd df-sample-xml-to-bq
docker build -t $LOCATION-docker.pkg.dev/$PROJECT_ID/$REPO/df-xml-to-bq:dev .
cd ..

# Push both the images to repo
docker push $LOCATION-docker.pkg.dev/$PROJECT_ID/$REPO/dataflow-2.40-base:dev
docker push $LOCATION-docker.pkg.dev/$PROJECT_ID/$REPO/df-xml-to-bq:dev
```

#### Build Dataflow flex template
```
gcloud dataflow flex-template build gs://$INPUT_BUCKET_NAME/dataflow-templates/xml-to-bq.json \
--image "$LOCATION-docker.pkg.dev/$PROJECT_ID/$REPO/df-xml-to-bq:dev" \
--sdk-language "PYTHON" \
--metadata-file df-sample-xml-to-bq/metadata.json \
--project $PROJECT_ID
```

### Demo

#### Upload Sample Data
```
gcloud storage cp ./sample-data/data.xml gs://$INPUT_BUCKET_NAME/data/
```

#### Run job using DirectRunner locally
```
cd df-sample-xml-to-bq

pip3 install -r requirements.txt

python3 xmltobq.py --input=../sample-data/data.xml \
--temp_location=gs://pw-df-temp-bkt/tmp \
--staging_location=gs://pw-df-temp-bkt/staging \
--output=$PROJECT_ID:$BQ_DATASET.bqtoxml \
--runner=DirectRunner
```

#### Run Job using Gcloud Command
```
gcloud dataflow flex-template run xml-to-bq-sample-pipeline \
--template-file-gcs-location gs://$INPUT_BUCKET_NAME/dataflow-templates/xml-to-bq.json \
--additional-experiments use_runner_v2 \
--additional-experiments=use_network_tags_for_flex_templates="dataflow-worker;allow-iap-ssh" \
--additional-experiments=use_network_tags="dataflow-worker;allow-iap-ssh" \
--additional-experiments=use_unsupported_python_version \
--disable-public-ips \
--network projects/$HOST_PROJECT_ID/global/networks/$NETWORK \
--subnetwork https://www.googleapis.com/compute/v1/projects/$HOST_PROJECT_ID/regions/$LOCATION/subnetworks/$SUBNET \
--service-account-email dataflow-worker-sa@$PROJECT_ID.iam.gserviceaccount.com \
--staging-location gs://$STAGING_BUCKET_NAME/staging \
--temp-location gs://$STAGING_BUCKET_NAME/tmp \
--region $LOCATION --worker-region=$LOCATION \
--parameters output=$PROJECT_ID:$BQ_DATASET.bqtoxml \
--parameters input=gs://$INPUT_BUCKET_NAME/data/* \
--parameters sdk_location=container \
--parameters sdk_container_image=$LOCATION-docker.pkg.dev/$PROJECT_ID/$REPO/dataflow-2.40-base:dev \
--project $PROJECT_ID
```

### CI/CD using Cloudbuild

#### Build Docker Image and Template with Cloud build
The below section uses gcloud command. In Real World scenario Cloud build triggers
can be created ahich can run this build job whenever their is change in the code.
```

# Build and push Base Image
gcloud builds submit --config cloudbuild_base.yaml . --project $PROJECT_ID --substitutions _LOCATION=$LOCATION,_PROJECT_ID=$PROJECT_ID,_REPOSITORY=$REPO

# Build and push launcher image and create flex template
gcloud builds submit --config cloudbuild_df_job.yaml . --project $PROJECT_ID --substitutions _LOCATION=$LOCATION,_PROJECT_ID=$PROJECT_ID,_REPOSITORY=$REPO,_TEMPLATE_PATH=gs://$INPUT_BUCKET_NAME/dataflow-templates
```

### Run Dataflow Flex template job from Composer Dags

#### Set Environment Variables for composer
```
export COMPOSER_ENV_NAME=<composer-env-name>
export COMPOSER_REGION=$LOCATION


COMPOSER_VAR_FILE=composer_variables.json
if [ ! -f "${COMPOSER_VAR_FILE}" ]; then
    envsubst < composer_variables.template > ${COMPOSER_VAR_FILE}
fi

gcloud composer environments storage data import \
--environment ${COMPOSER_ENV_NAME} \
--location ${COMPOSER_REGION} \
--source ${COMPOSER_VAR_FILE}

gcloud composer environments run \
${COMPOSER_ENV_NAME} \
--location ${COMPOSER_REGION} \
variables import -- /home/airflow/gcs/data/${COMPOSER_VAR_FILE}
```

#### Assign permissions to Composer Worker SA
```
COMPOSER_SA=$(gcloud composer environments describe  $COMPOSER_ENV_NAME --location $COMPOSER_REGION --project $PROJECT_ID --format json | jq '.config.nodeConfig.serviceAccount')

# Assign Service Account User permissions
gcloud projects add-iam-policy-binding $PROJECT_ID --member "serviceAccount:$COMPOSER_SA" --role roles/iam.serviceAccountUser
gcloud projects add-iam-policy-binding $PROJECT_ID --member "serviceAccount:$COMPOSER_SA" --role roles/dataflow.admin
```

#### Upload the dag to composer's dag bucket
```
DAG_PATH=$(gcloud composer environments describe $COMPOSER_ENV_NAME --location $COMPOSER_REGION --project $PROJECT_ID --format json | jq '.config.dagGcsPrefix')
gcloud storage cp dag/xml-to-bq-dag.py $DAG_PATH
```


Contributors: @singhpradeepk, @kkulczak, @akolkiewicz

Credit: Sample data has been borrowed from https://github.com/GoogleCloudPlatform/bigquery-oreilly-book/blob/master/blogs/xmlload/orders.xml with little modification.
