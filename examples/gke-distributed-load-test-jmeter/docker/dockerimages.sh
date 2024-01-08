#!/bin/bash -e

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
# Build and Push Docker Images for
# Jmeter Controller and Worker
# Globals:
#   None
# Arguments:
#   None
#######################################

docker build --tag="<artifact_registry_address>/jmeter-controller:latest" -f Dockerfile-controller .
docker build --tag="<artifact_registry_address>/jmeter-worker:latest" -f Dockerfile-worker .

gcloud auth configure-docker <GCP_REGION>-docker.pkg.dev

docker push <artifact_registry_address>/jmeter-controller:latest
docker push <artifact_registry_address>/jmeter-worker:latest