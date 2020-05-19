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

# Update variables
PROJECT_ID=gcs-connector
REGION=us-central1
NETWORK_NAME=dataingestion-net
DATAPROC_CLUSTER_NAME=dataproc-cluster
DATAPROC_SUBNET=dataproc-subnet
HADOOP_VERSION=hadoop2-2.2.0

# Use environment variables to set Terraform variables
export TF_VAR_project_id=${PROJECT_ID}
export TF_VAR_region=${REGION}
export TF_VAR_network_name=${NETWORK_NAME}
export TF_VAR_dataproc_cluster=${DATAPROC_CLUSTER_NAME}
export TF_VAR_dataproc_subnet=${DATAPROC_SUBNET}
export TF_VAR_hadoop_version=${HADOOP_VERSION}

echo "Cloning https://github.com/GoogleCloudDataproc/hadoop-connectors"
git clone https://github.com/GoogleCloudDataproc/hadoop-connectors

cd hadoop-connectors || exit

echo "Building JAR file"
if [[ $HADOOP_VERSION == *"hadoop2"* ]]
then
  if ! ./mvnw -P hadoop2 clean package
  then
    echo 'Error building JAR file from https://github.com/GoogleCloudDataproc/hadoop-connectors';
    exit
  fi
elif [[ $HADOOP_VERSION == *"hadoop3"* ]]
then
  if ! ./mvnw -P hadoop3 clean package
  then
    echo 'Error building JAR file from https://github.com/GoogleCloudDataproc/hadoop-connectors';
    exit
  fi
else
  echo "Unsupported Hadoop version at https://github.com/GoogleCloudDataproc/hadoop-connectors"
fi

cd ..

echo "Running Terraform to build Dataproc cluster"
(
  cd terraform || exit
  terraform init
  terraform apply -auto-approve
)

echo "Running test script on Dataproc cluster"
chmod u+x test_gcs_connector.sh
./test_gcs_connector.sh