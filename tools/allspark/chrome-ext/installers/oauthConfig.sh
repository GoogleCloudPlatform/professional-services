#!/bin/bash

# Copyright 2024 Google LLC. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Configures the OAuth screen and client in the GCP project to use with the Chrome Extension
# Requirements:
# - gcloud installed and authentication configured
# - sed tool. Installed by default in most linux and mac OS environment
#


# Function to display a message and exit
function error_exit() {
  echo "Error: $1"
  exit 1
}

OPTIONS=$(getopt -n "$0" -a -l "account:,project:" -- -- "$@")

eval set --  "$OPTIONS"

while [ $# -gt 0 ]
do
            case "$1" in
                --account) ACCOUNT="$2"; shift;;
                --project) PROJECT_ID="$2"; shift;;
                --) shift;;
            esac
            shift;
done

# Validate if project ID is provided as an argument
if [[ -z "$PROJECT_ID" ]]; then
  # Get default project ID if it exists
  DEFAULT_PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
  if [[ -z "$DEFAULT_PROJECT_ID" ]]; then
    error_exit "No project ID provided as argument or configured in gcloud."
  else
    echo "Using default project ID from gcloud: $DEFAULT_PROJECT_ID"
    PROJECT_ID="$DEFAULT_PROJECT_ID"
  fi
fi

# Validate project ID format (alphanumeric and hyphens)
if [[ ! "$PROJECT_ID" =~ ^[a-zA-Z0-9-]+$ ]]; then
  error_exit "Invalid project ID format. Use only alphanumeric characters and hyphens."
fi

# Check if project exists
if ! gcloud projects describe "$PROJECT_ID" >/dev/null 2>&1; then
  error_exit "Project with ID '$PROJECT_ID' not found."
fi

# Validate if account is provided as an argument
if [[ -z "$ACCOUNT" ]]; then
  # Get default account if it exists
  DEFAULT_ACCOUNT_ID=$(gcloud config get-value account 2>/dev/null)
  if [[ -z "$DEFAULT_ACCOUNT_ID" ]]; then
    error_exit "No account provided as argument or configured in gcloud."
  else
    echo "Using default account from gcloud: $DEFAULT_ACCOUNT_ID"
    ACCOUNT="$DEFAULT_ACCOUNT_ID"
  fi
fi

# Check if the IAP API is enabled
API_ENABLED=$(gcloud services list --enabled --project="$PROJECT_ID" | grep iap.googleapis.com)
if [ -z "$API_ENABLED" ]; then
    echo "IAP API is not enabled. Enabling..."
    gcloud services enable iap.googleapis.com --project="$PROJECT_ID"
fi

# Set the project Id in the chrome extension
echo "Using project '$PROJECT_ID' for the Chrome Extension..."
# Linux
#sed -i 's/__PROJECT_ID__/'"$PROJECT_ID"'/g' ../scripts/gcpApiCall.js
# Mac OS
sed -i '' 's/__PROJECT_ID__/'"$PROJECT_ID"'/g' ../scripts/gcpApiCall.js

# Create OAuth consent screen
echo "Creating OAuth consent screen for project '$PROJECT_ID'..."
gcloud iap oauth-brands create --application_title=all-spark --support_email="$ACCOUNT" --project="$PROJECT_ID" || error_exit "Failed to create IAP OAuth consent screen."

echo "OAuth configuration created successfully in GCP project '$PROJECT_ID'."