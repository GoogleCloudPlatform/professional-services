#!/usr/bin/env bash

# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Docker environment variables
export GOOGLE_ARTIFACT_REGISTRY_REPO="google-artifacact-registry-repo"
export PROJECT_ID="$(gcloud config get-value project || ${GOOGLE_CLOUD_PROJECT})"

# app/main.py environment variables
export MYSQL_DB="your_db_name"
export MYSQL_HOST="your_mysql_host.aivencloud.com"
export MYSQL_PASSWORD="your_mysql_password"

# Build docker image
docker build -t $GOOGLE_ARTIFACT_REGISTRY_REPO/mysql-test:v1.0.0 .

# Enable GAR API
gcloud services enable artifactregistry.googleapis.com

# Create an artifact repository
gcloud artifacts repositories create $GOOGLE_ARTIFACT_REGISTRY_REPO --repository-format=docker \
--location=us-central1 --description="Docker repository"

# Docker auth
gcloud auth -q configure-docker us-central1-docker.pkg.dev

# Push docker image to DockerHub
docker push us-central1-docker.pkg.dev/$PROJECT_ID$/GOOGLE_ARTIFACT_REGISTRY_REPO/mysql-test:v1.0.0

# Assume 'sample' namespace has been created and istio-injection labeled

# Deploy the application and service
sed -i -e "s/GOOGLE_ARTIFACT_REGISTRY_REPO/${GOOGLE_ARTIFACT_REGISTRY_REPO}/g" mysql-test.yaml
kubectl apply -f mysql-test.yaml -n sample

# Deploy the gateway
kubectl apply -f mysql-test-gateway.yaml -n sample

# Invoke on cluster 3
# See README for how to retrieve the ASM Ingress Gateway IP
curl http://<asm-ingress-gw-ip>/query

# Invoke on cluster 4
curl http://<asm-ingress-gw-ip>/query
