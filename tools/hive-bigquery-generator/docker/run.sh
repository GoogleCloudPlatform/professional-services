#!/bin/bash -e

# This script achieves the following:
#   1) Build the tool locally
#   2) Creates a docker image locally
#   3) Optionally pushes (you need to uncomment the docker push command)
#   4) Runs the docker image locally

# Prerequisites:
# Install Dependencies on your local
# a) Java 8
# b) gradle 7.4.1

# Access
# c) The user should have required permissions to create bigquery resources in the
#    project specified in the property file configured below
# d) Hive Metastore thrift URIs (specified in below configured properties file)  should be
#    accessible from your local or the VM in which image is run

cd $(dirname "$0")

# https://cloud.google.com/build/docs/interacting-with-dockerhub-images

#Sample Values, can be derived as done in "localrun/run.sh" file

#========== PROPERTIES TO BE CONFIGURED =========
# Docker Image (with tag) where the docker image will be pushed.
# If you don't have one, then use the script: create_artifact_registry.sh to create one
export IMAGE_TAG="latest"
export _IMAGE="nikunjbhartia/hive-to-bigquery:$IMAGE_TAG"

# This property file will be pushed in the docker image
# You should put full location of your own properties file in local filesystem.
# More details about the properties can be found in the README.md doc
# Below is a sample property file
export PROPERTIES_YML=../src/main/resources/application-local.yml
#================== END =========================


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

#Building the tool
sh ../localrun/local_build.sh

# Deriving the jar file name
export ROOT_PROJECT_NAME=$(grep 'rootProject.name' ../settings.gradle  | awk '{print $3;}' |  sed "s/['\"]//g")
export PACKAGE_VERSION=$(grep -E 'version\s+=' ../build.gradle | awk '{print $3;}' |  sed "s/['\"]//g" )
export JAR_FILE=$ROOT_PROJECT_NAME-$PACKAGE_VERSION.jar

# Copying the configured properties file in a predefined place for docker context to pickup
export COPIED_PROPERTY_FILENAME=application-copy.yml
cp "$PROPERTIES_YML" ../src/main/resources/$COPIED_PROPERTY_FILENAME || { echo "Provide correct location of your properties file in script"; exit 1; }

cd .. && docker build -t $_IMAGE \
 --build-arg=_JAR_FILE=$JAR_FILE \
 --build-arg=_PROPERTIES_YML=$COPIED_PROPERTY_FILENAME .

# You can also push the image to the docker hub registry if you are registered
#docker push $_IMAGE

#Execute via docker locally
#Mounting the local configs of the VM docker image wil execute
#This allows users to store GCP service account as well as connection information
#needed by the tool on a VM.
docker run -v ~/.config/:/root/.config --rm nikunjbhartia/hive-to-bigquery:latest -h

# Removing Copied Properties file from resources folder
rm src/main/resources/$COPIED_PROPERTY_FILENAME

echo "DONE"