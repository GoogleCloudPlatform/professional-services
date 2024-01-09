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
# Build and Push the Backup Cronjob image
# Globals:
#   BACKUP_IMAGE
# Arguments:
#   None
#######################################

# Load the variables
# shellcheck disable=SC1091
source ../backup.env

# Build with Artifact Registry address tag
docker build -t "${BACKUP_IMAGE}" .

# Autenticate and configure docker with Artifact Registory
gcloud auth configure-docker <GCP_REGION>-docker.pkg.dev

# Push the tagged docker image
docker push "${BACKUP_IMAGE}"
