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

source ./neo4j-env-variables.sh

echo "=============== Neo4j Restore ==============================="
echo "Beginning restore from google storage bucket $REMOTE_BACKUPSET"
echo "To Managed Graphdb Neo4j Staging /backups/$BACKUP_SET"
echo "============================================================"

echo "gcloud login"
gcloud auth login

echo "GKE connect neo4j cluster"
gcloud container clusters get-credentials "$CLUSTER_NAME" \
    --zone="$COMPUTE_ZONE"

echo "SSH into Server 1 cloud-sdk container and download backup"
kubectl exec neo4j-server-1-0 -n "<GKE_NAMESPACE>" -c "<CLOUD_SDK_SIDECAR_CONTAINER>" -- /bin/bash -c "`cat neo4j-gcloud-copy.sh`"

echo "SSH into Server 1 neo4j container and restore"
kubectl exec neo4j-server-1-0 -n "<GKE_NAMESPACE>" -c "<NEO4J_CONTAINER>" -- /bin/bash -c "`cat neo4j-restore-admin.sh`"

echo "SSH into Server 1 cloud-sdk container and clean-up"
kubectl exec neo4j-server-1-0 -n "<GKE_NAMESPACE>" -c "<CLOUD_SDK_SIDECAR_CONTAINER>" -- /bin/bash -c "`cat neo4k-restore-cleanup.sh`"

exit $?