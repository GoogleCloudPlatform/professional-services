#!/usr/bin/env bash

# Copyright 2020 Google LLC
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

# Shellcheck Ignore Errors
#
# SC2155: Declare and assign separately to avoid masking return values.
# shellcheck disable=SC2155

# Customize variables as needed

# read project ID from google cloud SDK config or environment variable
export TF_VAR_project_id="$(gcloud config get-value project || ${GOOGLE_CLOUD_PROJECT})"

# The directory of this project
export SRC_PATH=~/asm-private-multiclusters-intranet
export TF_VAR_source_path=~/asm-private-multiclusters-intranet

# The work directory for installation
export WORK_DIR=~/

# Bastion server information
export BASTION_IP="10.0.0.3"

# Leave this version number as it is for now
export ASM_MAJOR_VER=1
export ASM_MINOR_VER=7
export ASM_POINT_NUM=3
export ASM_REV_NUM=6

export ASM_VERSION="istio-${ASM_MAJOR_VER}.${ASM_MINOR_VER}.${ASM_POINT_NUM}-asm.${ASM_REV_NUM}"
export ASM_REVISION="asm-${ASM_MAJOR_VER}${ASM_MINOR_VER}${ASM_POINT_NUM}-${ASM_REV_NUM}"
export ASM_PKG_TYPE="linux-amd64"

# Cluster information
export PREFIX="asm"

export CLUSTER1_LOCATION="us-west2"
export CLUSTER2_LOCATION="us-west2"

export CLUSTER1_CLUSTER_NAME=cluster3
export CLUSTER1_CLUSTER_CTX=cluster3

export CLUSTER2_CLUSTER_NAME=cluster4
export CLUSTER2_CLUSTER_CTX=cluster4
