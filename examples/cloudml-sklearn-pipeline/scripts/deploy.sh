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
# Convenience script for deploying trained scikit-learn model.
#
# Prerequisites:
#   - Google Cloud SDK
#
# Globals:
#   PROJECT_ID: Google Cloud project to use.
#
# Arguments:
#   $1: Path to directory containing trained and exported scikit-learn model
#   $2: Name of the model to be deployed
#   $3: Version of the model to be deployed

MODEL_NAME=$1
VERSION_NAME=$2
JOB_DIR=$3

REGION=us-central1
FRAMEWORK=SCIKIT_LEARN
RUN_TIME=1.13
# Note that both Python 2.7 and Python 3.5 are supported,
# but Python 3.5 is the recommended one since 2.7 is deprecated soon
PYTHON_VERSION=3.5
MODEL_DIR=${JOB_DIR}"/model/"

PACKAGE_NAME="custom_scikit_learn-1.tar.gz"
PACKAGE_DIR=${JOB_DIR}"/${PACKAGE_NAME}"

# build the python package
python setup.py sdist

# upload the package to the same folder of the dumped model
gcloud storage cp "dist/${PACKAGE_NAME}" $PACKAGE_DIR

gcloud ai-platform models list | grep $MODEL_NAME &> /dev/null
if [ $? == 0 ]; then
   echo "Model already exists."
else
    # 1. Create model
    gcloud ai-platform models create $MODEL_NAME \
    --regions=$REGION \
    --enable-logging
fi


gcloud ai-platform versions list --model=$MODEL_NAME | grep $VERSION_NAME &> /dev/null
if [ $? == 0 ]; then
   echo "Version already exists."
else
    # 2. Create version
    gcloud beta ai-platform versions create $VERSION_NAME \
    --model $MODEL_NAME \
    --origin $MODEL_DIR \
    --runtime-version $RUN_TIME \
    --python-version $PYTHON_VERSION \
    --package-uris $PACKAGE_DIR \
    --prediction-class predictor.PipelineWrapper
fi