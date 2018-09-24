#!/bin/bash

###
###/*
### * Copyright (C) 2018 Google Inc.
### *
### * Licensed under the Apache License, Version 2.0 (the "License"); you may not
### * use this file except in compliance with the License. You may obtain a copy of
### * the License at
### *
### * http://www.apache.org/licenses/LICENSE-2.0
### *
### * Unless required by applicable law or agreed to in writing, software
### * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
### * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
### * License for the specific language governing permissions and limitations under
### * the License.
### */

# Configuration
PROJECT_ID=[PROJECT_ID]
BUCKET_NAME=[BUCKET_NAME]
REGISTRY_NAME=[REGISTRY_NAME]
REGION=[REGION]

TMP_FOLDER=/tmp/iot-core
CLIENT_APP_BASE_NAME=google-cloud-demo-iot-nirvana-client
CLIENT_JAR=${CLIENT_APP_BASE_NAME}-jar-with-dependencies.jar
INSTANCE_NUMBER=$(curl http://metadata/computeMetadata/v1beta1/instance/attributes/instance-number)
INDEX_START=$[$INSTANCE_NUMBER*10]

# Create a temporary folder and copy the client
echo "Creating temporary folder and downloading the client"
mkdir ${TMP_FOLDER}
/usr/bin/gsutil cp \
  gs://${BUCKET_NAME}/client/${CLIENT_JAR} \
  ${TMP_FOLDER}/${CLIENT_JAR} 1>${TMP_FOLDER}/startup_log.txt 2>&1

# Generate public and private keys for 10 clients
for i in `seq 0 9`;
do
  echo "Generating public/private keys for client ${i}"
  openssl req -x509 \
              -newkey rsa:2048 \
              -keyout ${TMP_FOLDER}/rsa_private_${i}.pem \
              -nodes \
              -out ${TMP_FOLDER}/rsa_cert_${i}.pem \
              -subj "/CN=CN-UNUSED"
  openssl pkcs8 -topk8 \
                -inform PEM \
                -outform DER \
                -in ${TMP_FOLDER}/rsa_private_${i}.pem \
                -nocrypt > ${TMP_FOLDER}/rsa_private_${i}_pkcs8
done

# Run 10 instances of the client
for i in `seq 0 9`;
do
  echo "Running client instance ${i}"
  /usr/bin/java -jar ${TMP_FOLDER}/${CLIENT_JAR} \
                -projectId ${PROJECT_ID} \
                -region ${REGION} \
                -registryName ${REGISTRY_NAME} \
                -rsaCertificateFilePath ${TMP_FOLDER}/rsa_cert_${i}.pem \
                -privateKey ${TMP_FOLDER}/rsa_private_${i}_pkcs8 \
                -cityIndex $[${INDEX_START}+${i}] 1>${TMP_FOLDER}/stdlog_client_$[${INDEX_START}+${i}].txt 2>&1 &
done
