#!/usr/bin/env bash

# Copyright 2019 Google Inc. All Rights Reserved.
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
# ==============================================================================
#
# Convenience script for requesting online prediction on AI Platform.
#
# Prerequisites:
#   - Google Cloud SDK
#
# Globals:
#   PROJECT_ID: Google Cloud project to use.
#
# Arguments:
#   $1: Path to file contained data for prediction in the format of:
#   a list of simple lists, each representing a data instance.
#   $2: Name of the model
#   $3: Version of the model

INPUT_DATA_FILE=$1
MODEL_NAME=$2
VERSION_NAME=$3

gcloud ai-platform predict \
--model $MODEL_NAME  \
--version $VERSION_NAME \
--json-instances $INPUT_DATA_FILE