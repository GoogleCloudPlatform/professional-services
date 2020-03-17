#!/bin/bash
# Copyright 2019 Google LLC.
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

PROJECT_ID=gcs-connector
PROJECT_NAME=gcs-connector
REGION=us-central1
NETWORK_NAME=dataingestion-net
DATAPROC_CLUSTER_NAME=dataproc-cluster
DATAPROC_SUBNET=dataproc-subnet
HADOOP_VERSION=hadoop2-2.1.0
TEST_BUCKET=output-examples

# Use environment variables to set Terraform variables
export TF_VAR_project_id=${PROJECT_ID}
export TF_VAR_project_name=${PROJECT_NAME}
export TF_VAR_region=${REGION}
export TF_VAR_network_name=${NETWORK_NAME}
export TF_VAR_dataproc_cluster=${DATAPROC_CLUSTER_NAME}
export TF_VAR_dataproc_subnet=${DATAPROC_SUBNET}
export TF_VAR_hadoop_version=${HADOOP_VERSION} 

echo "Cloning https://github.com/GoogleCloudDataproc/hadoop-connectors" 
git clone https://github.com/GoogleCloudDataproc/hadoop-connectors

cd hadoop-connectors

echo "Building JAR file"
if [[ $HADOOP_VERSION == *"hadoop2"* ]]
then
  ./mvnw -P hadoop2 clean package
elif [[ $HADOOP_VERSION == *"hadoop3"* ]]
then
  ./mvnw -P hadoop3 clean package
else
  echo "Unsupported Hadoop version at https://github.com/GoogleCloudDataproc/hadoop-connectors"
fi

cd ..

echo "Running Terraform to build Dataproc cluster"
cd terraform
terraform init
terraform apply -auto-approve

cd .. 

echo "Running test script on Dataproc cluster"
chmod +x test_gcs_connector.sh
./test_gcs_connector.sh














