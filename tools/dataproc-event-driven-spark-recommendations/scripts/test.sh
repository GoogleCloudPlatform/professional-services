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

# Run in Cloud Shell to deploy a sample dataproc cluster

usage() {
    echo "Usage: [ -i projectId ] [ -r region ] [ -c clusterName ]"
}
export -f usage

while getopts ":i:r:c:" opt; do
    case $opt in
        i ) projectId="$OPTARG";;
        r ) region="$OPTARG";;
        c ) clusterName="$OPTARG";;
        \?) echo "Invalid option -$OPTARG"
        usage
        exit 1
        ;;
    esac
done

echo "===================================================="
echo " Inputs ..."
echo " Project ID: ${projectId}" 
echo " Region: ${region}" 
echo " Cluster Name: ${clusterName}" 

echo "===================================================="
echo " Setting up project ..."

gcloud config set project "$projectId"

gcloud services enable storage-component.googleapis.com 
gcloud services enable compute.googleapis.com  
gcloud services enable servicenetworking.googleapis.com 
gcloud services enable iam.googleapis.com 
gcloud services enable dataproc.googleapis.com
gcloud services enable cloudbilling.googleapis.com

echo "===================================================="
echo " Setting external IP access ..."

echo "{
  \"constraint\": \"constraints/compute.vmExternalIpAccess\",
	\"listPolicy\": {
	    \"allValues\": \"ALLOW\"
	  }
}" > external_ip_policy.json

gcloud resource-manager org-policies set-policy external_ip_policy.json --project="$projectId"

sleep 90

echo "===================================================="
echo " Creating cluster ..."

gcloud dataproc clusters create "${clusterName}-sample" \
    --region="$region"

