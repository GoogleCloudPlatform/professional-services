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

action=$1
branch=$2
policysource=$3
project_id=$4
policy_type=$5 # FILESYSTEM or CLOUDSOURCE
root_dir=$(pwd)
base_dir=$root_dir/user-resources
tmp_plan="${root_dir}/tmp_plan" #if you change this, update build triggers
environments_regex="^(development|non-production|production|shared)$"

tf_apply_diff() {
local input=$root_dir/logs/user_resources_folder_diff.log
input_rows=$(cat "$input")
  for env_path in $input_rows; do
    env="$(basename "$env_path")"
    component=$(basename "$(dirname "$env_path")")
    echo "env_path: $env_path"
    tf_init "$root_dir/$env_path" "$env" "$component"
    tf_plan "$root_dir/$env_path" "$env" "$component"
    tf_apply "$root_dir/$env_path" "$env" "$component"
  done
}

tf_apply_all(){
    # Get all folders inside `user-resources`.
    business_units=$(find "$base_dir" -mindepth 1 -maxdepth 1 -type d)
    for business_unit in $business_units; do
      # Get all environment folders inside each business-unit folder.
      env_paths=$(find "$business_unit" -mindepth 1 -maxdepth 1 -type d)
      for env_path in $env_paths; do
          env=$(basename "$env_path")
          component=$(basename "$business_unit")
          echo "env_path: $env_path"
          tf_init "$env_path" "$env" "$component"
          tf_plan "$env_path" "$env" "$component"
          tf_apply "$env_path" "$env" "$component"
      done
    done
}
## Terraform apply for single environment.
tf_apply() {
  local path=$1
  local tf_env=$2
  local tf_component=$3
  echo "*************** TERRAFORM APPLY *******************"
  echo "      At environment: ${tf_component}/${tf_env} "
  echo "***************************************************"
  if [ -d "$path" ]; then
    cd "$path" || exit
    terraform apply -input=false -auto-approve "${tmp_plan}/${tf_component}-${tf_env}.tfplan" || exit 1
    cd "$base_dir" || exit
  else
    echo "ERROR:  
    ${path} does not exist"
  fi
}

## terraform init for single environment.
tf_init() {
  local path=$1
  local tf_env=$2
  local tf_component=$3
  echo "*************** TERRAFORM INIT *******************"
  echo "      At environment: ${tf_component}/${tf_env} "
  echo "**************************************************"
  if [ -d "$path" ]; then
    cd "$path" || exit
    terraform init || exit 11
    cd "$base_dir" || exit
  else
    echo "ERROR:  ${path} does not exist"
  fi
}

## terraform plan for single environment.
tf_plan() {
  local path=$1
  local tf_env=$2
  local tf_component=$3
  echo "*************** TERRAFORM PLAN *******************"
  echo "      At environment: ${tf_component}/${tf_env} "
  echo "**************************************************"
  if [ ! -d "${tmp_plan}" ]; then
    mkdir "${tmp_plan}" || exit
  fi
  if [ -d "$path" ]; then
    cd "$path" || exit
    terraform plan -input=false -out "${tmp_plan}/${tf_component}-${tf_env}.tfplan" || exit 21
    cd "$base_dir" || exit
  else
    echo "ERROR:  ${tf_env} does not exist"
  fi
}

## terraform init/plan/validate for all valid environments matching regex.
tf_plan_validate_all() {
  local env
  local component
  find "$base_dir" -mindepth 1 -maxdepth 1 -type d \
  -not -path "$base_dir/modules" \
  -not -path "$base_dir/.terraform" | while read -r component_path ; do
    component="$(basename "$component_path")"
    find "$component_path" -mindepth 1 -maxdepth 1 -type d | while read -r env_path ; do
      env="$(basename "$env_path")"
      if [[ "$env" =~ $environments_regex ]] ; then
        tf_init "$env_path" "$env" "$component"
        tf_plan "$env_path" "$env" "$component"
        tf_validate "$env_path" "$env" "$policysource" "$component"
      else
        echo "$component/$env doesn't match $environments_regex; skipping"
      fi
    done
  done
}

## terraform show for single environment.
tf_show() {
  local path=$1
  local tf_env=$2
  local tf_component=$3
  echo "*************** TERRAFORM SHOW *******************"
  echo "      At environment: ${tf_component}/${tf_env} "
  echo "**************************************************"
  if [ -d "$path" ]; then
    cd "$path" || exit
    terraform show "${tmp_plan}/${tf_component}-${tf_env}.tfplan" || exit 41
    cd "$base_dir" || exit
  else
    echo "ERROR:  ${path} does not exist"
  fi
}

## terraform validate for single environment.
tf_validate() {
  local path=$1
  local tf_env=$2
  local policy_file_path=$3
  local tf_component=$4
  echo "*************** TERRAFORM VALIDATE ******************"
  echo "      At environment: ${tf_component}/${tf_env} "
  echo "      Using policy from: ${policy_file_path} "
  echo "*****************************************************"
  if ! command -v terraform-validator &> /dev/null; then
    echo "terraform-validator not found!  Check path or visit"
    echo "https://github.com/GoogleCloudPlatform/terraform-validator/blob/main/docs/install.md"
  elif [ -z "$policy_file_path" ]; then
    echo "no policy repo found! Check the argument provided for policysource to this script."
    echo "https://github.com/GoogleCloudPlatform/terraform-validator/blob/main/docs/policy_library.md"
  else
    if [ -d "$path" ]; then
      cd "$path" || exit
      terraform show -json "${tmp_plan}/${tf_component}-${tf_env}.tfplan" > "${tf_env}.json" || exit 32
      if [[ "$policy_type" == "CLOUDSOURCE" ]]; then
        # Check if $policy_file_path is empty so we clone the policies repo only once
        if [ -z "$(ls -A "${policy_file_path}" 2> /dev/null)" ]; then
          gcloud source repos clone gcp-policies "${policy_file_path}" --project="${project_id}" || exit 34
        fi
      fi
      terraform-validator validate "${tf_env}.json" --policy-path="${policy_file_path}" --project="${project_id}" || exit 33
      cd "$base_dir" || exit
    else
      echo "ERROR:  ${path} does not exist"
    fi
  fi
}

# Runs single action for each instance of env in folder hierarchy.
single_action_runner() {
  local env
  local component
  find "$base_dir" -mindepth 1 -maxdepth 1 -type d \
  -not -path "$base_dir/modules" \
  -not -path "$base_dir/.terraform" | while read -r component_path ; do
    component="$(basename "$component_path")"
     # sort -r is added to ensure shared is first if it exists.
    find "$component_path" -mindepth 1 -maxdepth 1 -type d | sort -r | while read -r env_path ; do
      env="$(basename "$env_path")"
      # perform action only if folder matches branch OR folder is shared & branch is production.
      if [[ "$env" == "$branch" ]] || [[ "$env" == "shared" && "$branch" == "production" ]]; then
        case "$action" in
          apply )
            tf_apply "$env_path" "$env" "$component"
            ;;

          init )
            tf_init "$env_path" "$env" "$component"
            ;;

          plan )
            tf_plan "$env_path" "$env" "$component"
            ;;

          show )
            tf_show "$env_path" "$env" "$component"
            ;;

          validate )
            tf_validate "$env_path" "$env" "$policysource" "$component"
            ;;
          * )
            echo "unknown option: ${action}"
            ;;
        esac
      else
        echo "${env} doesn't match ${branch}; skipping"
      fi
    done
  done
}

case "$action" in
  init|plan|apply|show|validate )
    single_action_runner
    ;;

  apply_diff )
    tf_apply_diff
    ;;

  apply_all )
    tf_apply_all
    ;;

  * )
    echo "unknown option: ${1}"
    exit 99
    ;;
esac