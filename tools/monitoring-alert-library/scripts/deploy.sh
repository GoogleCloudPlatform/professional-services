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
  echo "  $0 <project_id> <log_metrics_folder> <alerts_folder>"
  echo ""
  echo "Arguments:"
  echo "  project_id: The Google Cloud Project ID where the resources will be created."
  echo "  log_metrics_folder: The directory containing the log-based metrics definition files (YAML)."
  echo "  alerts_folder:     The directory containing the alert policy definition files (YAML or JSON)."
  echo ""
  echo "Description:"
  echo "  This script first deploys log-based metrics and then alert policies."
  echo "  It recursively searches the specified folders for .yaml/.json files"
  echo "  and attempts to create or update the corresponding resources in the target <project_id>."
  echo ""
  echo "Examples:"
  echo "  $0 my-gcp-project-id ./log-metrics/ ./alert-policies/"
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
# shellcheck disable=SC2329
get_display_name() {
  local file="$1"
  if [[ "$file" == *.yaml || "$file" == *.yml ]]; then
    yq eval '.displayName' "$file" 2>/dev/null
  else
    echo "" # Should not happen due to earlier checks
  fi
}



# Function to process a single log-based metric file
# Arguments:
#   $1: project_id
#   $2: file path
# shellcheck disable=SC2329
function process_log_metric_file() {
  local project_id="$1"
  local file="$2"
  local output
  local metric_name

  if [[ ! "$file" == *.yaml && ! "$file" == *.yml ]]; then
     echo "Skipping non-YAML file: $file"
     return
  fi

  echo "---------------"
  echo "Processing log-based metric file: $file for project $project_id"

  metric_name=$(basename "$file" .yaml)

  echo "Found metric name in file: '$metric_name'"
  echo "Checking for existing metric with name: '$metric_name' in project '$project_id'..."
  existing_metric=$(gcloud logging metrics list --project="$project_id" --filter="name=\"$metric_name\"" --format="value(name)" 2>/dev/null)

  if [[ -n "$existing_metric" ]]; then
    echo "Metric with name '$metric_name' found. Attempting to update..."
    if ! output=$(gcloud logging metrics update "$metric_name" --project="$project_id" --config-from-file="$file" 2>&1); then
      echo "Error updating Log-based Metric '$metric_name' from '$file' in project '$project_id':"
      echo "$output"
      exit 1
    else
      echo "Log-based Metric '$metric_name' from '$file' updated successfully in project '$project_id'."
    fi
  else
    echo "Metric with name '$metric_name' not found. Attempting to create..."
    if ! output=$(gcloud logging metrics create "$metric_name" --project="$project_id" --config-from-file="$file" 2>&1); then
      echo "Error creating Log-based Metric from '$file' in project '$project_id':"
      echo "$output"
      exit 1
    else
      echo "Log-based Metric from '$file' created successfully in project '$project_id'."
    fi
  fi
}

# Function to process a single alert policy file
# Arguments:
#   $1: project_id
#   $2: file path
# shellcheck disable=SC2329
function process_alert_file() {
  local project_id="$1"
  local file="$2"
  local output

  # Only process YAML and JSON files
  if [[ ! "$file" == *.yaml && ! "$file" == *.yml ]]; then
     echo "Skipping non-YAML/JSON file: $file"
     return
  fi

  echo "---------------"
  echo "Processing alert file: $file for project $project_id"

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
      exit 1
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
      exit 1
    else
      echo "Monitoring Policy from '$file' created successfully in project '$project_id'."
    fi
  fi
}

# Recursive function to traverse a folder and process files
# Arguments:
#   $1: project_id
#   $2: current directory path
#   $3: processing function
function traverse_folder() {
  local project_id="$1"
  local current_dir="$2"
  local process_function="$3"
  local item

  if [[ ! -d "$current_dir" ]]; then
    echo "Error: Directory '$current_dir' not found or is not a directory."
    return 1
  fi

   if [[ ! -r "$current_dir" ]]; then
    echo "Warning: Directory '$current_dir' is not readable. Skipping."
    return 0
  fi

  echo "Searching in directory: $current_dir"

  local has_error=0
  for item in "$current_dir"/*; do
    if [[ -f "$item" && -r "$item" ]]; then
      "$process_function" "$project_id" "$item"
    elif [[ -d "$item" ]]; then
      if ! traverse_folder "$project_id" "$item" "$process_function"; then
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

if [[ $# -ne 3 ]]; then
  echo "Error: Incorrect number of arguments."
  print_usage
  exit 1
fi

PROJECT_ID="$1"
LOG_METRICS_FOLDER_PATH="$2"
ALERTS_FOLDER_PATH="$3"

if [[ -z "$PROJECT_ID" ]]; then
   echo "Error: Project ID cannot be empty."
   print_usage
   exit 1
fi

if [[ -z "$LOG_METRICS_FOLDER_PATH" ]]; then
   echo "Error: Log-based metrics folder path cannot be empty."
   print_usage
   exit 1
fi

if [[ -z "$ALERTS_FOLDER_PATH" ]]; then
   echo "Error: Alerts folder path cannot be empty."
   print_usage
   exit 1
fi

echo "Starting deployment..."
echo "Project ID: $PROJECT_ID"
echo "========================================="

echo "Deploying Log-based Metrics..."
echo "Log Metrics Folder: $LOG_METRICS_FOLDER_PATH"
echo "-----------------------------------------"
if ! traverse_folder "$PROJECT_ID" "$LOG_METRICS_FOLDER_PATH" process_log_metric_file; then
    echo "========================================="
    echo "Script finished with errors during log-based metric deployment."
    exit 1
fi
echo "Log-based Metrics deployment finished."
echo "========================================="


echo "Deploying Monitoring Alert Policies..."
echo "Alerts Folder: $ALERTS_FOLDER_PATH"
echo "-----------------------------------------"
if traverse_folder "$PROJECT_ID" "$ALERTS_FOLDER_PATH" process_alert_file; then
    echo "========================================="
    echo "Script finished successfully."
    exit 0
else
    echo "========================================="
    echo "Script finished with errors during alert policy deployment."
    exit 1
fi