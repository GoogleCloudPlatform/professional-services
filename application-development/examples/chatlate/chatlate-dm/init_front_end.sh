#!/bin/bash
set -x
set -o errexit
PROJECT=$(gcloud info --format='value(config.project)')
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