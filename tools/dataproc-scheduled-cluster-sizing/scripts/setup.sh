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
    echo "Usage: [ -p projectId ] [ -n projectNumber ] [ -r region ] [ -s schedule ]  [ -a primarySize ] [ -b secondarySize ] [ -k labelKey ] [ -v labelVal ] "
}
export -f usage

while getopts ":p:n:r:s:a:b:k:v:" opt; do
    case $opt in
        p ) projectId="$OPTARG";;
        n ) projectNumber="$OPTARG";;
        r ) region="$OPTARG";;
        s ) schedule="$OPTARG";;
        a ) primarySize="$OPTARG";;
        b ) secondarySize="$OPTARG";;
        k ) labelKey="$OPTARG";;
        v ) labelVal="$OPTARG";;
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
echo " Schedule: ${schedule}"
echo " Primary Size: ${primarySize}"
echo " Secondary Size: ${secondarySize}"
echo " Cluster Label Key: ${labelKey}"
echo " Cluster Label Value: ${labelVal}"

echo "===================================================="
echo " Setting up project ..."

gcloud config set project "$projectId"

echo "===================================================="
echo " Updating terraform variables ..."

cd terraform || exit

# edit the variables
export TF_VARS_FILE=dscs-"$labelKey"-"$labelVal"-"$primarySize"-"$secondarySize".tfvars
cp input.template.tfvars "$TF_VARS_FILE"
sed -i "s|%%PROJECT_ID%%|$projectId|g" "$TF_VARS_FILE"
sed -i "s|%%PROJECT_NUMBER%%|$projectNumber|g" "$TF_VARS_FILE"
sed -i "s|%%REGION%%|$region|g" "$TF_VARS_FILE"
sed -i "s|%%SCHEDULE%%|$schedule|g" "$TF_VARS_FILE"
sed -i "s|%%PRIMARY_SIZE%%|$primarySize|g" "$TF_VARS_FILE"
sed -i "s|%%SECONDARY_SIZE%%|$secondarySize|g" "$TF_VARS_FILE"
sed -i "s|%%LABEL_KEY%%|$labelKey|g" "$TF_VARS_FILE"
sed -i "s|%%LABEL_VAL%%|$labelVal|g" "$TF_VARS_FILE"

cat "$TF_VARS_FILE"

echo "===================================================="
echo " Applying terraform ..."

terraform init
terraform plan
terraform apply --var-file="$TF_VARS_FILE"
