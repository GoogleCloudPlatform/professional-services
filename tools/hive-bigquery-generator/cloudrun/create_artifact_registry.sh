# One Time
# This is container registry to store the docker image of this tool.
# This is one time activity and is required only if the user doesn't have any active container registry
# Reference: https://cloud.google.com/build/docs/build-push-docker-image#create_a_docker_repository_in

#Create  Docker repo

export REGION="asia-south1"
export PROJECT="fk-data-validation-demo"
export REPO_NAME="hive-bq-external-view"

gcloud artifacts repositories create $REPO_NAME \
  --repository-format=docker \
  --location=$REGION \
  --project $PROJECT \
  --description="Hive to BigQuery"

#Verify that registry creation is complete
gcloud artifacts repositories list \
  --project $PROJECT