#!/bin/bash -e

# This script achieves the following:
#   1) Build the tool externally using cloud build (this will ensure you dont need to install required dependencies on your local)
#   2) Create a docker image
#   3) Push the image to the configured container registry
#   4) Create a Cloud Run Job with configured properties
#   5) Executes the Cloud Run Job Once
#   6) Optionally schedule this cloudrun job using cloud scheduler

# Note:
#   a) For testing, use run.sh in the `localrun` folder instead
#   b) This should be used in case the job needs to be scheduled using cloud scheduler
#   c) This uses gcloud, so, ensure you have gcloud installed and execute
#      `gcloud auth login` command to authenticate the gcloud command via your user
#   d) Ensure that you configure the next section correctly

cd $(dirname "$0")

#============================= PROPERTIES TO BE CONFIGURED ========================

# This property file will be pushed in the docker image
# You should put full location of your own properties file in local filesystem.
# More details about the properties can be found in the README.md doc
# Below is a sample property file
export PROPERTIES_YML=../src/main/resources/application-local.yml

# Project where cloud build, cloudrun, cloud scheduler will run
export PROJECT_ID=fk-data-validation-demo

#Display name of the cloud run Job that will be created (should not be already present in cloud run)
export RUN_JOB_NAME=hive-bq-external-view-job-$(date +'%Y%m%d%H%M')

#Resources to be used by the VM on which cloud run will run the docker image
export CPU=8
export MEMORY=8G

# Specify the service account that should be used by the Cloud Run Job to create BigQuery resources
# Note: [Ref: https://cloud.google.com/iam/docs/service-accounts-actas]
#   The deploying user who is impersonating this service account should have ServiceAccountUser role
#   configured in this service account principals
# Below is a sample service account and will not work
export CLOUD_RUN_SERVICE_ACCOUNT=fk-query-validation@fk-data-validation-demo.iam.gserviceaccount.com

#Region where the job should run
export REGION=asia-south1

# Docker Image (with tag) where the docker image will be pushed.
# If you don't have one, then use the script: create_artifact_registry.sh to create one
export IMAGE_TAG="latest"

# Format: <region>-docker.pkg.dev/<GCP_PROJECT>/<ARTIFACT_REGISTRY_REPO_NAME>/<IMAGE_NAME>:<TAG>
# Note: IMAGE_NAME:TAG can be of your own choice, rest is static based on the artifact registry repo created
# See create_artifact_registry.sh for reference
export IMAGE="asia-south1-docker.pkg.dev/fk-data-validation-demo/hive-bq-external-view/generator:$IMAGE_TAG"

##  Creating Schedule for the Cloud Run Job [ OPTIONAL  ]

# Ignore the following properties in case you don't want to set a schedule and Choose Option 1 during runtime when asked

#Display name of the cloud run Schedule that will be created (should not be already present in cloud run)
export SCHEDULER_JOB_NAME="hive-bq-external-view-schedule-$(date +'%Y%m%d%H%M')"

# Use a service account that has Cloud Run Invoker role on the cloud run job
# If no explicit service account is there, then the default compute service account of the project has enough permissions
# Note: The one mentioned below is a test service account, and will not be valid
export SCHEDULER_SERVICE_ACCOUNT="1094780077035-compute@developer.gserviceaccount.com"

# Schedules are specified using unix-cron format.
# E.g. every minute: "* * * * *", every 3 hours: "0 */3 * * *", every Monday at 9:00: "0 9 * * 1".
# Ref: https://cloud.google.com/scheduler/docs/configuring/cron-job-schedules
export SCHEDULE="0 */1 * * *"

#=========================================== END =================================================

read -p  "Have you updated the Properties section of this script ? (y/n) : " choice
if [[ $choice = "y" ||  $choice = "Y" ]]
then
  echo "Using properties from the script"

elif [[ $choice = "n" || $choice = "N" ]]
then
  echo "Update the script properties section; aborting"
  exit 1
else
  echo "Invalid Choice"
  exit 1
fi

#Deriving JAR file name
export ROOT_PROJECT_NAME=$(grep 'rootProject.name' ../settings.gradle  | awk '{print $3;}' |  sed "s/['\"]//g")
export PACKAGE_VERSION=$(grep -E 'version\s+=' ../build.gradle | awk '{print $3;}' |  sed "s/['\"]//g" )
export JAR_FILE=$ROOT_PROJECT_NAME-$PACKAGE_VERSION.jar

# Copying the configured properties file in a predefined place for docker context to pickup
export COPIED_PROPERTY_FILENAME=application-copy.yml
cp $PROPERTIES_YML ../src/main/resources/$COPIED_PROPERTY_FILENAME || { echo "Provide correct location of your properties file in script"; exit 1; }

echo "Note: The docker image will be using the properties file: $PROPERTIES_YML"
echo "If this is not intended, then stop the process and update the config section of this script. "

# Building the tool externally, creating the docker image and pushing to configured Docker Image URL
cd .. && gcloud builds submit \
 --project=$PROJECT_ID \
 --region=$REGION \
 --config cloudrun/cloudbuild.yml \
 --substitutions="_PROPERTIES_YML=$COPIED_PROPERTY_FILENAME,_IMAGE=$IMAGE,_JAR_FILE=$JAR_FILE"  .

# Creating a Cloud Run Job
gcloud beta run jobs create "$RUN_JOB_NAME" \
  --project=$PROJECT_ID \
  --region=$REGION \
  --image $IMAGE \
  --cpu=$CPU \
  --memory=$MEMORY \
  --service-account="$CLOUD_RUN_SERVICE_ACCOUNT"

# Removing Copied Properties file from resources folder
rm src/main/resources/$COPIED_PROPERTY_FILENAME

echo ""
echo "RUN the JOB one time or as a CRON : "
echo "[1] Run Once"
echo "[2] Run as a CRON"
read -p "Enter Choice : " run_choice

if [ "$run_choice" = 1 ]
then
  # Running the cloud run Job Once
  gcloud beta run jobs execute "$RUN_JOB_NAME" \
    --project=$PROJECT_ID \
    --region $REGION
elif [ "$run_choice" = 2 ]
then
    # Creating a schedule for the cloud run Job
    # Ref: https://cloud.google.com/run/docs/execute/jobs-on-schedule#command-line
    echo "Creating a Schedule $SCHEDULER_JOB_NAME at $SCHEDULE for the cloud run job $RUN_JOB_NAME"
    gcloud scheduler jobs create http $SCHEDULER_JOB_NAME \
      --project=$PROJECT_ID \
      --location $REGION \
      --schedule="$SCHEDULE" \
      --uri="https://$REGION-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/$PROJECT_ID/jobs/$RUN_JOB_NAME:run" \
      --http-method POST \
      --oauth-service-account-email "$SCHEDULER_SERVICE_ACCOUNT"
    echo "DONE"
else
  echo "Invalid Choice; aborting"
fi