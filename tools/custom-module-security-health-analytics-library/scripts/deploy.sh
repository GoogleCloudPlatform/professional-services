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

function print_usage() {
  echo "Usage:"
  echo "  $0 sha <folder> <--organization ORG_ID | --folder FOLDER_ID | --project PROJECT_ID> <parent_id>"
  echo ""
  echo "Arguments:"
  echo "  action:       The type of resource to deploy (constraint, policy, or sha)."
  echo "  folder:       The directory containing the YAML/YML definition files."
  echo "  parent_flag:  Required for 'sha' action. Specifies the parent resource type."
  echo "                Must be --organization, --folder, or --project."
  echo "  parent_id:    Required for 'sha' action. The ID of the organization, folder, or project."
  echo ""
  echo "Examples:"
  echo "  $0 sha ../samples/gcloud/sha/ --organization 123456789012"
  echo "  $0 sha ../sha_custom_modules/ --folder 9876543210"
  echo "  $0 sha ./modules/ --project my-gcp-project-id"
  echo ""
  echo "Note: The 'sha' action requires the 'jq' command-line JSON processor to be installed."
}

# Function to check if gcloud is installed
function check_gcloud() {
  if ! command -v gcloud &> /dev/null; then
    echo "Error: Google Cloud SDK (gcloud) is not installed or not in PATH."
    return 1
  fi
  return 0
}

# Function to check if jq is installed
function check_jq() {
  if ! command -v jq &> /dev/null; then
    echo "Error: 'jq' (command-line JSON processor) is not installed or not in PATH."
    return 1
  fi
  return 0
}


# Function providing installation instructions
function install_gcloud() {
  echo "Please install the Google Cloud SDK (gcloud)."
  echo "Refer to the official installation instructions for your operating system:"
  echo "https://cloud.google.com/sdk/docs/install"
  echo
  echo "After installation, ensure 'gcloud' is in your system's PATH and run 'gcloud init'."
}

# Function providing jq installation instructions
function install_jq() {
  echo "Please install 'jq'."
  echo "Installation instructions can be found at: https://jqlang.github.io/jq/download/"
  echo "On Debian/Ubuntu: sudo apt-get update && sudo apt-get install jq"
  echo "On RedHat/CentOS: sudo yum install jq"
  echo "On macOS (Homebrew): brew install jq"
}

# Function to process a single file
# Arguments:
#   $1: action (sha)
#   $2: file path
#   $3: parent_flag (e.g., --organization)
#   $4: parent_value (e.g., 12345)
function process_file() {
  local action="$1"
  local file="$2"
  local parent_flag="$3"
  local parent_value="$4"
  local output
  local display_name

  if [[ ! "$file" == *.yaml && ! "$file" == *.yml ]]; then
     return
  fi

  echo "---------------"
  echo "Processing file: $file (Action: $action)"

  if [[ "$action" == "sha" ]]; then
    parent_arg="${parent_flag}=${parent_value}"
    display_name=$(basename "$file" .yaml)
    display_name=$(basename "$display_name" .yml) # Handle both extensions
    display_name=${display_name//[-_]/ } # Replace hyphens/underscores with spaces

    echo "Checking for existing SHA Custom Module with display name '$display_name' under $parent_arg..."
    if ! existing_modules_json=$(gcloud scc custom-modules sha list "$parent_arg" --format=json 2>&1); then
        echo "Error listing existing SHA custom modules for $parent_arg:"
        echo "$existing_modules_json"
        echo "Skipping processing for '$file' due to list error."
        return
    fi

    resource_name=$(echo "$existing_modules_json" | jq -r --arg dn "$display_name" '.[] | select(.displayName == $dn) | .name' | head -n 1)
    if [[ -n "$resource_name" ]]; then
      if ! output=$(gcloud scc custom-modules sha update "$resource_name" \
          --custom-config-from-file="$file" \
          --enablement-state=ENABLED \
          2>&1); then
        echo "Error updating SHA Custom Module '$resource_name' from '$file':"
        echo "$output"
      else
        echo "SHA Custom Module '$resource_name' updated successfully from '$file'."
      fi
    else
      if ! output=$(gcloud scc custom-modules sha create \
          --display-name="$display_name" \
          --custom-config-from-file="$file" \
          --enablement-state=ENABLED \
          "$parent_flag"="$parent_value" \
          2>&1); then
            echo "Error creating SHA Custom Module from '$file' for $parent_flag $parent_value:"
            echo "$output"
      else
          echo "SHA Custom Module from '$file' created successfully for $parent_flag $parent_value."
      fi
    fi
  fi
}

# Recursive function to traverse the file structure
# Arguments:
#   $1: action (sha)
#   $2: current directory path
#   $3: parent_flag
#   $4: parent_value
function traverse_folder() {
  local action="$1"
  local current_dir="$2"
  local parent_flag="$3"
  local parent_value="$4"
  local item

  if [[ ! -d "$current_dir" ]]; then
    echo "Warning: Directory '$current_dir' not found or is not a directory. Skipping."
    return
  fi
   if [[ ! -r "$current_dir" ]]; then
    echo "Warning: Directory '$current_dir' is not readable. Skipping."
    return
  fi

  for item in "$current_dir"/*; do
    if [[ -f "$item" && -r "$item" ]]; then
      process_file "$action" "$item" "$parent_flag" "$parent_value"
    elif [[ -d "$item" ]]; then
      traverse_folder "$action" "$item" "$parent_flag" "$parent_value"
    fi
  done
}

if ! check_gcloud; then
  install_gcloud
  exit 1
fi

if ! check_jq; then
  install_jq
  exit 1
fi

if [[ $# -lt 1 ]]; then
  echo "Error: No action specified."
  print_usage
  exit 1
fi

action="$1"
folder="$2"
parent_flag=""
parent_value=""

case "$action" in
  "sha")
    # SHA requires exactly 4 arguments: action, folder, parent_flag, parent_value
    if [[ $# -ne 4 ]]; then
      echo "Error: Incorrect number of arguments for 'sha' action."
      print_usage
      exit 1
    fi

    folder="$2"
    parent_flag="$3"
    parent_value="$4"

    if [[ "$parent_flag" != "--organization" && "$parent_flag" != "--folder" && "$parent_flag" != "--project" ]]; then
       echo "Error: Invalid parent flag '$parent_flag'. Must be --organization, --folder, or --project."
       print_usage
       exit 1
    fi

    if [[ -z "$parent_value" ]]; then
       echo "Error: Parent ID cannot be empty for '$parent_flag'."
       print_usage
       exit 1
    fi

    traverse_folder "$action" "$folder" "$parent_flag" "$parent_value"
    ;;
  *)
    echo "Error: Invalid action '$action'."
    print_usage
    exit 1
    ;;
esac

exit 0