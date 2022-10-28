#!/bin/bash
# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Run in Cloud Shell to set up your project and deploy solution via terraform.

usage() {
    echo "Usage: [ -i projectId ] [ -n projectNumber ] [ -r region ] [ -z zone ]"
}
export -f usage

while getopts ":i:n:r:z:" opt; do
    case $opt in
        i ) projectId="$OPTARG";;
        n ) projectNumber="$OPTARG";;
        r ) region="$OPTARG";;
        z ) zone="$OPTARG";;
        \?) echo "Invalid option -$OPTARG"
        usage
        exit 1
        ;;
    esac
done

echo "===================================================="
echo " Inputs ..."
echo " Project ID: ${projectId}" 
echo " Project Number: ${projectNumber}" 
echo " Region: ${region}" 
echo " Zone: ${zone}" 

echo "===================================================="
echo " Setting up project ..."

gcloud config set project "$projectId"

gcloud services enable storage-component.googleapis.com 
gcloud services enable compute.googleapis.com  
gcloud services enable servicenetworking.googleapis.com 
gcloud services enable iam.googleapis.com 
gcloud services enable dataproc.googleapis.com
gcloud services enable cloudbilling.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable pubsub.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable eventarc.googleapis.com

echo "===================================================="
echo " Updating terraform variables ..."

cd terraform || exit

# edit the variables.tf

sed -i "s|%%PROJECT_ID%%|$projectId|g" variables.tf
sed -i "s|%%PROJECT_NUMBER%%|$projectNumber|g" variables.tf
sed -i "s|%%REGION%%|$region|g" variables.tf
sed -i "s|%%ZONE%%|$zone|g" variables.tf

cat variables.tf

echo "===================================================="
echo " Applying terraform ..."

terraform init
terraform plan
terraform apply
