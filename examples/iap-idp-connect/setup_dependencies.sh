#!/bin/bash
# Copyright 2023 Google LLC
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


# Check if both parameters are provided
if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <PROJECT_ID> <MEMBER>"
  exit 1
fi

PROJECT_ID="$1"
MEMBER="$2"

# Enable Compute Engine API and assign roles
gcloud services enable compute.googleapis.com
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="$MEMBER" --role="roles/compute.networkAdmin"

# Enable Identity Toolkit API and assign roles
gcloud services enable identitytoolkit.googleapis.com
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="$MEMBER" --role="roles/identitytoolkit.viewer"

# Enable Cloud Identity-Aware Proxy (IAP) API and assign roles
gcloud services enable iap.googleapis.com
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="$MEMBER" --role="roles/iap.viewer"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="$MEMBER" --role="roles/iap.settingsEditor"

# Enable API Keys API and assign roles
gcloud services enable apikeys.googleapis.com
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="$MEMBER" --role="roles/apikeys.admin"

# Enable Firebase Management API and assign roles
gcloud services enable firebase.googleapis.com
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="$MEMBER" --role="roles/firebase.viewer"