#!/bin/bash

#  Copyright 2024 Google LLC
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

# Function to check if gcloud is installed
function check_gcloud() {
  if ! command -v gcloud &> /dev/null; then
    echo "[$0][ERROR] Google Cloud SDK (gcloud) is not installed."
    return 1
  fi
  return 0
}

# Function providing installation instructions
function install_gcloud() {
  echo "Installing the Google Cloud SDK..."
  echo "Please refer to the official installation instructions for your operating system:"
  echo "https://cloud.google.com/sdk/docs/install" 
  echo
  echo "The installation includes the gcloud command-line tool."
}

# Function get organization id from values.yaml for gcloud parameter
function get_organization_id() {
  organization_id=$( yq -r .organization values.yaml )
  if [ -z "$organization_id" ]; then
    echo "[$0][ERROR] Invalid organization in values.yaml"
    return 1
  fi

  echo "$organization_id"
}


# Function to process a single file
function process_file() {
  local constraint_file="$1"
  local policy_file="$2"

  echo "[$0] Processing constraint: $constraint_file, policy: $policy_file"
  gcloud beta policy-intelligence simulate orgpolicy \
    --organization="$organization_id" \
    --custom-constraints="$constraint_file" \
    --policies="$policy_file" >> "$output_file"

}

# Function to construct associated policy folder or file using constraint folder or file
function construct_policy_item() {
  local constraint_item="$1"
  local policies_folder="$2"
  
  if [[ $constraint_item == *.yaml || $constraint_item == *.yml ]]; then
    policy_item=$policies_folder/custom.${constraint_item##*/}
  else
    policy_item=$policies_folder/${constraint_item##*/}
  fi

  echo "$policy_item"
}

# Recursive function to traverse the file structure 
function traverse_folder() {
  local constraints_folder="$1"
  local policies_folder="$2"

  for item in "$constraints_folder"/*; do
    policy_item=$( construct_policy_item "$item" "$policies_folder")
    if [[ -f "$item" && -f "$policy_item" ]]; then
      process_file "$item" "$policy_item" 
    elif [[ -d "$item" && -d "$policy_item" ]]; then
      traverse_folder "$item" "$policy_item" # Recursion for subfolders
    else
      echo "[$0] Associated policy directory or file not found for constraint: $item. skipping."
    fi
  done
}

check_gcloud
gcloud_installed=$?

# Guide installation if necessary
if [[ $gcloud_installed -ne 0 ]]; then
  install_gcloud
fi

if [[ $# -lt 3 ]]; then
  echo "Error: Please provide an action parameter."
  echo "Usage: $0 [constraints-folder] [policies-folder] [output-folder]"
  exit 1
fi

constraints_folder=$1
policies_folder=$2
output_folder=$3
organization_id=$( get_organization_id )
output_file=$output_folder/simulation-results-$(date +"%Y%m%d%H%M").txt

[ -d "$output_folder" ] || mkdir -p "$output_folder"
[ ! -f "$output_file" ] || rm "$output_file"

traverse_folder "$constraints_folder" "$policies_folder"

