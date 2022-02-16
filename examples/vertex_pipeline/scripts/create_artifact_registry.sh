#!/bin/bash
# Copyright 2021 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Submits a Cloud Build job that builds and deploys
# the pipelines and pipelines components

# Creat a regional Artifact Registry

if [ $# -ne 1 ]
then
    echo "Creates a artifact registry in pre-configured region (default asia-southeast1)."
    echo "Usage: create_artifact_registry.sh <registry_name>"
    exit 0
fi

AF_REGISTRY_NAME=$1
PROJECT_ID=$(gcloud config get-value core/project)
# Set regional artifact registry location
AF_REGION=asia-southeast1

if ! (gcloud artifacts repositories list --project="$PROJECT_ID" --location=$AF_REGION | grep --fixed-strings "$AF_REGISTRY_NAME"); then

  gcloud artifacts repositories create "$AF_REGISTRY_NAME" \
    --repository-format=docker \
    --location=$AF_REGION \
    --project="$PROJECT_ID" \
    --description="Artifact Registry ${AF_REGISTRY_NAME} in ${AF_REGION}."
fi

gcloud artifacts repositories list --project="$PROJECT_ID"
