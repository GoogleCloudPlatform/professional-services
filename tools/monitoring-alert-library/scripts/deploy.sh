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

# Function to print usage instructions
function print_usage() {
  echo "Usage:"
  echo "  $0 <project_id> <folder>"
  echo ""
  echo "Arguments:"
  echo "  project_id: The Google Cloud Project ID where the monitoring policies will be created."
  echo "  folder:     The directory containing the alert policy definition files (YAML or JSON)."
  echo ""
  echo "Description:"
  echo "  This script recursively searches the specified <folder> for .yaml files"
  echo "  and attempts to create a Google Cloud Monitoring Alert Policy from each file"
  echo "  in the target <project_id> using 'gcloud alpha monitoring policies create'."
  echo ""
  echo "Examples:"
  echo "  $0 my-gcp-project-id ./alert-policies/"
  echo "  $0 production-project-123 ../../monitoring/alerts"
  echo ""
  echo "Note: This script uses 'gcloud alpha' commands."
  echo "      It attempts to *create* policies. If a policy with the same display name"
  echo "      already exists, the 'gcloud' command might fail for that specific file."
}

# Function to check if gcloud is installed
function check_gcloud() {
  if ! command -v gcloud &> /dev/null; then
    echo "Error: Google Cloud SDK (gcloud) is not installed or not in PATH."
    return 1
  fi
  if ! gcloud alpha --help &>/dev/null; then
      echo "Warning: 'gcloud alpha' components might not be installed."
      echo "You might need to run: gcloud components install alpha"
  fi
  return 0
}

# Function providing installation instructions for gcloud
function install_gcloud() {
  echo "Please install the Google Cloud SDK (gcloud)."
  echo "Refer to the official installation instructions for your operating system:"
  echo "https://cloud.google.com/sdk/docs/install"
  echo
  echo "After installation, ensure 'gcloud' is in your system's PATH, run 'gcloud init',"
  echo "and authenticate using 'gcloud auth login' or activate a service account."
  echo "You may also need alpha components: 'gcloud components install alpha'"
}

# Function to extract display name from YAML or JSON file
get_display_name() {
  local file="$1"
  if [[ "$file" == *.yaml || "$file" == *.yml ]]; then
    yq eval '.displayName' "$file" 2>/dev/null
  else
    echo "" # Should not happen due to earlier checks
  fi
}


# Function to process a single alert policy file
# Arguments:
#   $1: project_id
#   $2: file path
function process_file() {
  local project_id="$1"
  local file="$2"
  local output

  # Only process YAML and JSON files
  if [[ ! "$file" == *.yaml && ! "$file" == *.yml ]]; then
     echo "Skipping non-YAML/JSON file: $file"
     return
  fi

  echo "---------------"
  echo "Processing file: $file for project $project_id"

  display_name=$(get_display_name "$file")

  if [[ -z "$display_name" || "$display_name" == "null" ]]; then
    echo "Error: Could not extract 'displayName' from '$file'. Skipping."
    return
  fi
  echo "Found displayName in file: '$display_name'"
  echo "Checking for existing policy with displayName: '$display_name' in project '$project_id'..."
  existing_policy_id=$(gcloud alpha monitoring policies list \
    --project="$project_id" \
    --filter="displayName=\"$display_name\"" \
    --format="value(name)" \
    2>/dev/null)


  if [[ -n "$existing_policy_id" ]]; then
    # Policy exists, attempt to update
    echo "Policy with displayName '$display_name' found with ID: $existing_policy_id"
    if ! output=$(gcloud alpha monitoring policies update "$existing_policy_id" \
        --policy-from-file="$file" \
        --project="$project_id" \
        2>&1); then
      echo "Error updating Monitoring Policy '$existing_policy_id' from '$file' in project '$project_id':"
      echo "$output"
    else
      echo "Monitoring Policy '$existing_policy_id' from '$file' updated successfully in project '$project_id'."
    fi
  else
    if ! output=$(gcloud alpha monitoring policies create \
        --policy-from-file="$file" \
        --project="$project_id" \
        2>&1); then
      echo "Error creating Monitoring Policy from '$file' in project '$project_id':"
      echo "$output"
    else
      echo "Monitoring Policy from '$file' created successfully in project '$project_id'."
    fi
  fi
}

# Recursive function to traverse the file structure
# Arguments:
#   $1: project_id
#   $2: current directory path
function traverse_folder() {
  local project_id="$1"
  local current_dir="$2"
  local item

  # Check if the directory exists and is a directory
  if [[ ! -d "$current_dir" ]]; then
    echo "Error: Directory '$current_dir' not found or is not a directory. Stopping traversal for this path."
    return 1
  fi

  # Check if the directory is readable
   if [[ ! -r "$current_dir" ]]; then
    echo "Warning: Directory '$current_dir' is not readable. Skipping."
    return 0
  fi

  echo "Searching in directory: $current_dir"

  local has_error=0
  for item in "$current_dir"/*; do
    if [[ -f "$item" && -r "$item" ]]; then
      process_file "$project_id" "$item"
    elif [[ -d "$item" ]]; then
      if ! traverse_folder "$project_id" "$item"; then
          has_error=1 
      fi
    fi
  done
  return $has_error
}

if ! check_gcloud; then
  install_gcloud
  exit 1
fi

if [[ $# -ne 2 ]]; then
  echo "Error: Incorrect number of arguments."
  print_usage
  exit 1
fi

PROJECT_ID="$1"
FOLDER_PATH="$2"

if [[ -z "$PROJECT_ID" ]]; then
   echo "Error: Project ID cannot be empty."
   print_usage
   exit 1
fi

if [[ -z "$FOLDER_PATH" ]]; then
   echo "Error: Folder path cannot be empty."
   print_usage
   exit 1
fi

echo "Starting monitoring policy deployment..."
echo "Project ID: $PROJECT_ID"
echo "Policy Folder: $FOLDER_PATH"
echo "========================================="

# Start the traversal
if traverse_folder "$PROJECT_ID" "$FOLDER_PATH"; then
    echo "========================================="
    echo "Script finished successfully."
    exit 0
else
    echo "========================================="
    echo "Script finished with errors (directory not found or not accessible)."
    exit 1
fi