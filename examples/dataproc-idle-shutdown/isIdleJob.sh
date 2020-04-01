#!/bin/bash
# Copyright 2019 Google, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

readonly MY_CLUSTER_NAME="$(/usr/share/google/get_metadata_value attributes/dataproc-cluster-name)"
readonly MAX_IDLE_SECONDS_KEY="${MY_CLUSTER_NAME}_maxIdleSeconds"
readonly DATAPROC_PERSIST_DIAG_TARBALL_KEY="${MY_CLUSTER_NAME}_persistDiagnosticTarball"
readonly KEY_PROCESS_LIST_KEY="${MY_CLUSTER_NAME}_keyProcessList"
readonly ROLE=$(/usr/share/google/get_metadata_value attributes/dataproc-role)
readonly PERSIST_DIAG_TARBALL_TRUE="TRUE"
readonly PERSIST_DIAG_TARBALL_FALSE="FALSE"

function checkMaster() {
  local role="$(/usr/share/google/get_metadata_value attributes/dataproc-role)"
  local isMaster="false"
  if [[ "$role" == 'Master' ]] ; then
    isMaster="true"
  fi
  echo "$isMaster"
}

function startIdleJobChecker() {
  # check if bucket and has been passed
  local SCRIPT_STORAGE_LOCATION=$(/usr/share/google/get_metadata_value attributes/script_storage_location)
  local MAX_IDLE_PARAMETER=$(/usr/share/google/get_metadata_value attributes/max-idle)
  local DATAPROC_PERSIST_DIAG_TARBALL=$(/usr/share/google/get_metadata_value attributes/persist_diagnostic_tarball)
  local KEY_PROCESS_LIST_PARAMETER=$(/usr/share/google/get_metadata_value attributes/key_process_list)
  echo "attempting to start idle checker using: ${SCRIPT_STORAGE_LOCATION}"
  if [[ -n ${SCRIPT_STORAGE_LOCATION} ]]; then
    
    # Get and validate the max idle parameter. Following line evaluates to nothing if not provided or properly formatted.
    parsedMaxIdleParameter=$(echo ${MAX_IDLE_PARAMETER} | sed  -n '/^\([0-9]*\)\(s\|m\|h\|d\)$/p' | sed  's/^\([0-9]*\)\(s\|m\|h\|d\)$/\1\,\2/' )
    if [[ -n ${parsedMaxIdleParameter} ]]; then
      idleTimeUnit=$(echo ${parsedMaxIdleParameter#*,})
      idleTimeAmount=$(echo ${parsedMaxIdleParameter%,*})
      idleTimeAmountSeconds=300

      # Convert max idle to minutes (most readable and likely value)
      case "$idleTimeUnit" in
        's')
          idleTimeAmountSeconds=$(( idleTimeAmount ))
          ;;
        'm')
          idleTimeAmountSeconds=$(( idleTimeAmount * 60 ))
          ;;
        'h')
          idleTimeAmountSeconds=$(( idleTimeAmount * 60 * 60 ))
          ;;
        'd')
          idleTimeAmountSeconds=$(( idleTimeAmount * 60 * 60 * 24 ))
          ;;
      esac

      # Record the max seconds value as instance metadata
      echo $( gcloud compute project-info add-metadata --metadata ${MAX_IDLE_SECONDS_KEY}=${idleTimeAmountSeconds})

      # Record preference for persisting diagnostic information on cluster shutdown
      persistDiagnosticTarball=${PERSIST_DIAG_TARBALL_FALSE}
      parsedPesistDiagnosticTarballParameter=$(echo ${DATAPROC_PERSIST_DIAG_TARBALL} | sed -n '/\(TRUE\|true\)/p' )
      if [[ -n ${parsedPesistDiagnosticTarballParameter} ]]; then
        persistDiagnosticTarball=${PERSIST_DIAG_TARBALL_TRUE}
      fi
      echo $( gcloud compute project-info add-metadata --metadata ${DATAPROC_PERSIST_DIAG_TARBALL_KEY}=${persistDiagnosticTarball})

      # Record key process list parameter
      keyProcessListParam=${KEY_PROCESS_LIST_PARAMETER}
      echo $( gcloud compute project-info add-metadata --metadata ${KEY_PROCESS_LIST_KEY}=${keyProcessListParam})

      echo "establishing isIdle process to determine when master node can be deleted"
      cd /root
      mkdir DataprocShutdown
      cd DataprocShutdown

      # copy the script from GCS
      gsutil cp "${SCRIPT_STORAGE_LOCATION}/isIdle.sh" .
      # make it executable
      chmod 700 isIdle.sh
      # run IsIdle script
      ./isIdle.sh

      #sudo bash -c 'echo "" >> /etc/crontab'
      sudo bash -c 'echo "*/5 * * * * root /root/DataprocShutdown/isIdle.sh" >> /etc/crontab'
    else
      echo "Must provide value for 'max-idle' The duration from the moment when the cluster enters the idle state to the moment when the cluster starts to delete. Provide the duration in IntegerUnit format, where the unit can be 's, m, h, d' (seconds, minutes, hours, days, respectively)."
      exit 1;
    fi
  else
    echo "value for STORAGE_LOCATION is required"
    exit 1;
  fi
}

function main() {
  is_master_node=$(checkMaster)
  echo "Is master is $is_master_node"
  if [[ "$is_master_node" == "true" ]]; then
    startIdleJobChecker
  fi
}

main "$@"
