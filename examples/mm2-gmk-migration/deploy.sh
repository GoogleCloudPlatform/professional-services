#!/bin/bash

 # Copyright 2022 Google LLC
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

# Running terraform scripts with storing required files in GCS bucket 
# bash deploy.sh mm2-binaries-bucket
BUCKET_NAME=$1
mkdir -p binaries

# kafka 
curl -fSL https://downloads.apache.org/kafka/3.7.1/kafka_2.13-3.7.1.tgz --output ./binaries/kafka_2.13-3.7.1.tgz


# Prometheus
# wget https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.13.0/jmx_prometheus_javaagent-0.13.0.jar
curl -fSL https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.13.0/jmx_prometheus_javaagent-0.13.0.jar --output ./binaries/jmx_prometheus_javaagent-0.13.0.jar

# Java
curl -fSL https://download.java.net/java/GA/jdk11/9/GPL/openjdk-11.0.2_linux-x64_bin.tar.gz --output ./binaries/openjdk-11.0.2_linux-x64_bin.tar.gz


# Copying resource folder to GCS bucket
gsutil cp -r ./binaries/* gs://$BUCKET_NAME/binaries


# # terraform initialization
# terraform init

# # terraform plan to check the resources being created
# terraform plan

# # deploy the resources
# terraform apply