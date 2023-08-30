#!/bin/bash

# Copyright 2023 Google Inc. All Rights Reserved.
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

#######################################
# Deploy the Neo4j Backup Cronjob
# Globals:
#   GKE_NAMESPACE
# Arguments:
#   None
#######################################
 
# Load global variables
. ../backup.env

# Authenticate via gcloud-sdk
gcloud auth login

# Use correct namespace and deploy the cronjob
kubectl config set-context --current --namespace="${GKE_NAMESPACE}"
kubectl apply -f backup-cronjob.yaml