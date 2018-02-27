#!/bin/bash
set -x
set -o errexit

echo "Initializing Build Triggers"
WEBAPP_REPO=chatlate-webapp-java
TRANSLATE_REPO=chatlate-translate-java
WEBAPP_BUILD_TRIGGER_FILE=build_trigger.json
TRANSLATE_BUILD_TRIGGER_FILE=translate_build_trigger.json

add-apt-repository ppa:git-core/ppa -y
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
apt-get update -y
apt-get install git nodejs build-essential jq -y

PROJECT=$(gcloud info --format='value(config.project)')

gcloud services enable cloudbuild.googleapis.com -q || true

###### Chat Webapp
# Create the build trigger.
cd ~/
cat > $WEBAPP_BUILD_TRIGGER_FILE <<- EOM
  {
    "triggerTemplate": {
      "projectId": "${PROJECT}",
      "repoName": "${WEBAPP_REPO}",
      "branchName": "master"
    },
    "description": "Chatlate Chat Application Build Trigger",
    "filename": "cloudbuild.yaml"
  }
EOM

curl -s -H"Authorization: Bearer $(gcloud config config-helper --format='value(credential.access_token)')" https://cloudbuild.googleapis.com/v1/projects/$PROJECT/triggers > existing_triggers.json
if ! cat existing_triggers.json | python -m json.tool | grep 'Chatlate Chat Application Build Trigger' -q ; then
 echo "Creating Build Trigger"
 curl -s -XPOST -T $WEBAPP_BUILD_TRIGGER_FILE -H"Authorization: Bearer $(gcloud config config-helper --format='value(credential.access_token)')" https://cloudbuild.googleapis.com/v1/projects/$PROJECT/triggers
fi


###### Translate Webapp
# Create the build trigger.
cd ~/
cat > $TRANSLATE_BUILD_TRIGGER_FILE <<- EOM
  {
    "triggerTemplate": {
      "projectId": "${PROJECT}",
      "repoName": "${TRANSLATE_REPO}",
      "branchName": "master"
    },
    "description": "Chatlate Translate Application Build Trigger",
    "filename": "cloudbuild.yaml"
  }
EOM

curl -s -H"Authorization: Bearer $(gcloud config config-helper --format='value(credential.access_token)')" https://cloudbuild.googleapis.com/v1/projects/$PROJECT/triggers > existing_triggers.json
if ! cat existing_triggers.json | python -m json.tool | grep 'Chatlate Translate Application Build Trigger' -q ; then
 echo "Creating Build Trigger"
 curl -s -XPOST -T $TRANSLATE_BUILD_TRIGGER_FILE -H"Authorization: Bearer $(gcloud config config-helper --format='value(credential.access_token)')" https://cloudbuild.googleapis.com/v1/projects/$PROJECT/triggers
fi

echo "Done Initializing Build Triggers"

###### React Front End
echo "Publishing Front End to GCS"

SOURCE_REPO=source
SOURCE_REPO_URL=https://github.com/aolarte/professional-services.git
SOURCE_REPO_BRANCH=andresolarte-chatlate
SOURCE_REPO_FOLDER=application-development/examples/chatlate

# Checkout Source Repo
mkdir -p ~/${PROJECT}/${SOURCE_REPO}
cd ~/${PROJECT}/${SOURCE_REPO}
git init
git config core.sparseCheckout true
git remote add -f origin $SOURCE_REPO_URL
echo "${SOURCE_REPO_FOLDER}/*" > .git/info/sparse-checkout
git checkout $SOURCE_REPO_BRANCH



APPLICATION_BUCKET_NAME=$(gcloud compute project-info describe --format='value(commonInstanceMetadata.items.applicationBucketName)')

cd ~/${PROJECT}/${SOURCE_REPO}/${SOURCE_REPO_FOLDER}/chatlate-front-end
sed -i 's|http://localhost:8080/|http://chat.endpoints.'$PROJECT'.cloud.goog/|'  src/containers/Login.js

npm set progress=false
npm install
# Since we're not serving the app from the root directory, we need to set the homepage URL to build the right paths
jq -c '. + { "homepage": "https://storage.googleapis.com/'$APPLICATION_BUCKET_NAME'/" }' package.json > package.json.new
cp package.json.new package.json
npm run build
gsutil rsync -R build gs://$APPLICATION_BUCKET_NAME/
echo "Done Publishing Front End to GCS!"
