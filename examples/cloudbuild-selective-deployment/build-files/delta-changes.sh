#!/bin/bash

# Copyright 2021 Google LLC
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

set -eo pipefail

project=$1
apply_trigger_name=$2
build_id=$3
commit_sha=$4
current_trigger_name=$5
manual_previous_commit_sha=$6 # Optional
# Signifies that last successful build and commit associated with it can be found within given limit. Increase the value if last successful build does not exists in given limit.
build_find_limit=400

for ((i = 1; i < 6; i++ )); do
  if [[ -z ${!i} ]]; 
  then
      echo "Missing required argument ${i} for delta-changes.sh"
      exit 1
  fi
done

# Make sure there is a logs dir and a file for logging.
create_logs_dir() {
    local logs_dir=$1
    
    # Create logs directory.
    if [ -d "${logs_dir}" ]; then rm -rf "$logs_dir"; fi
    mkdir "$logs_dir"
}

# Find trigger id from trigger name.
get_trigger_value() {
    local trigger_name=$1
    local project=$2
    local value=$3
    local ret_value
    
    ret_value=$(gcloud beta builds triggers describe "${trigger_name}" --format "value($value)" --project "${project}")
    echo "${ret_value}"
}

## Find the nth successful commit associated with nth successful build. n=1 implies last/latest successful build's commit.
nth_successful_commit() {
  local n=$1  # 
  local apply_trigger_name=$2
  local project=$3
  local apply_trigger_id
  local nth_successful_build
  local nth_successful_commit

  apply_trigger_id=$(get_trigger_value "$apply_trigger_name" "$project" "id")
  nth_successful_build=$(gcloud builds list --filter "buildTriggerId=$apply_trigger_id AND STATUS=(SUCCESS)" --format "value(id)" --limit="$build_find_limit" --project "$project" | awk "NR==$n") || exit 1
  nth_successful_commit=$(gcloud builds describe "$nth_successful_build" --format "value(substitutions.COMMIT_SHA)" --project "$project") || exit 1
  
  echo "${nth_successful_commit}"
}

base_dir=$(pwd)
logs_dir=$base_dir/logs
user_resources_regex="user-resources\\/[_a-zA-Z0-9-]*[/][_a-zA-Z0-9-]*[/]"

# Make sure there is a logs dir and a file for logging.
create_logs_dir "$logs_dir"  || exit 1

# If manual commit sha is given, use that for the diff.
if [ -z "$manual_previous_commit_sha" ] ; then
    echo "command : nth_successful_commit 1 $apply_trigger_name $project"
    previous_commit_sha=$(nth_successful_commit 1 "$apply_trigger_name" "$project") || exit 1
else
    echo "Using manually provided commit sha $manual_previous_commit_sha for diff."
    previous_commit_sha="$manual_previous_commit_sha" 
fi

# Log build details to the console.
echo "Running delta changes for build_id: ${build_id}, build_trigger: ${current_trigger_name}"

# Finding the diff. Prereq : Unshallow version of git clone.
echo "command: git diff --name-only ${previous_commit_sha} ${commit_sha} | sort -u > $logs_dir/diff.log"
git diff --name-only "${previous_commit_sha}" "${commit_sha}" | sort -u > "$logs_dir"/diff.log || exit 1
cat "$logs_dir"/diff.log

# Get the projects from diff.
echo "command: grep -o $user_resources_regex $logs_dir/diff.log | sort --unique > $logs_dir/project_folder_diff.log"
grep -o "$user_resources_regex" "$logs_dir"/diff.log | sort --unique > "$logs_dir"/user_resources_folder_diff.log
cat "$logs_dir"/user_resources_folder_diff.log