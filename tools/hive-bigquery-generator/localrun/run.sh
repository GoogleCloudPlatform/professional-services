#!/bin/bash -e

# This script is to build and run the app locally

# Prerequisites:
# Install Dependencies on your local
# a) Java 8
# b) gradle 7.4.1

# Access
# c) The user should have required permissions to create bigquery resources in the
#    project specified in the property file configured below
# d) Hive Metastore thrift URIs (specified in below configured properties file)  should be accessible from your local

cd $(dirname $0)
export PROJECT_ROOT=..

#================== PROPERTIES TO BE CONFIGURED ===================
# Property File
# Note: You should put location of your own properties file.
# More details about the properties can be found in the README.md doc
# Below is a sample property file
export PROPERTIES_YML=../src/main/resources/application-local.yml
#======================== END ==================================

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
sh local_build.sh

#Deriving Jar File name
export ROOT_PROJECT_NAME=$(grep 'rootProject.name' $PROJECT_ROOT/settings.gradle  | awk '{print $3;}' |  sed "s/['\"]//g")
export PACKAGE_VERSION=$(grep -E 'version\s+=' $PROJECT_ROOT/build.gradle | awk '{print $3;}' |  sed "s/['\"]//g" )
export JAR_FILE=$ROOT_PROJECT_NAME-$PACKAGE_VERSION.jar
export JAR_FOLDER=$PROJECT_ROOT/build/libs

#Creating Log Folders
mkdir -p $JAR_FOLDER/logs

#Copying the configured Properties File which needs to be applied in the jar folder and naming
#it application.yml so that the jar can automatically pickup this external properties file
cp $PROPERTIES_YML $JAR_FOLDER/application.yml

#Executing Jar
#To run job and output logs in console as well as in file
cd $JAR_FOLDER/ && java \
  -Xmx8G \
  -jar $JAR_FILE \
   2>&1 | tee logs/execution.log

#To run job in background and store logs in file
#java \
#  -Xmx8G \
#  -jar $JAR_FILE \
#  > logs/execution.log 2>&1 &

echo "Find  logs in $JAR_FOLDER/logs/execution.log file"