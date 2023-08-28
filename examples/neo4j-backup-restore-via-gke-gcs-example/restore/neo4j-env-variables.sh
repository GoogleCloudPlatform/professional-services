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

export BACKUP_NAME=graph.db-backup
export BACKUP_SET="$BACKUP_NAME-$(date "+%Y-%m-%d-%H:%M:%S")"
export REMOTE_BACKUPSET="<GCS_BUCKET>"
export CLUSTER_NAME="<GKE_CLUSTER_NAME>"
export COMPUTE_ZONE="<GKE_COMPUTE_ZONE>"
export IMAGE_VERSION=1.0
export GKE_NAMESPACE="<GKE_NAMESPACE>"

