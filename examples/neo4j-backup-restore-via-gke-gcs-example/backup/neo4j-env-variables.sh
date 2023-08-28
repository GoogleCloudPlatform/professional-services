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

# Set these variable values in accordance with the project and Neo4j 
# instance deployed on Google Kubernetes Engine

export BACKUP_NAME=graph.db-backup
BACKUP_SET="${BACKUP_NAME}-$(date "+%Y-%m-%d-%H:%M:%S")"
REMOTE_BACKUPSET="<GCS_BUCKET>"
export REMOTE_BACKUPSET
export BACKUP_SET
export IMAGE_VERSION=1.0
export BACKUP_IMAGE="<GCP_REGION>-docker.pkg.dev/<PROJECT_NAME>/<ARTIFACT_REPOSITORY_NAME>/<IMAGE_NAME>:${IMAGE_VERSION}"
export GKE_NAMESPACE="<GKE_NAMESPACE>"
export NEO4J_ADMIN_SERVER_1="<NEOR4J_ADMIN_SERVER_IP_1>:6362"
export NEO4J_ADMIN_SERVER_2="<NEOR4J_ADMIN_SERVER_IP_2>:6362"
export NEO4J_ADMIN_SERVER_3="<NEOR4J_ADMIN_SERVER_IP_3>:6362"