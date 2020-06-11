#!/bin/sh
# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Name of the Instance to be created
INSTANCE_NAME=$1

# Database to be created
DATABASE_NAME=$2

# Region in which instance is to be created
REGION=${3:-us-east1}

# check if there is an existing instance with the given name
echo "Checking if instance exists with the same name"

if gcloud sql instances describe "${INSTANCE_NAME}" > /dev/null ; then
    echo "Instance with this name already exists.Try with a different name"
    exit 0
else
    # create cloud sql instance and add the cluster ip to authorized networks
    if gcloud sql instances create "${INSTANCE_NAME}" --tier=db-n1-standard-1 --region="${REGION}" ; then
        echo "Instance created successfully"
        gcloud sql databases create "${DATABASE_NAME}" --instance "${INSTANCE_NAME}"
        gcloud sql users set-password root --host % --instance "${INSTANCE_NAME}" --prompt-for-password
        output=$(gcloud sql instances describe "${INSTANCE_NAME}" --format="value(connectionName,ipAddresses[0].ipAddress)")
        connectionName=$(echo "${output}" | cut -d ' ' -f 1)
        ipaddress=$(echo "${output}" | cut -d ' ' -f 2)
        echo "IP Address of Cloud SQL instance is ${ipaddress}"
        echo "Connection name of the instance is ${connectionName}"
    else
        echo "Instance creation failed"
    fi
fi