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
readonly MASTER_INSTANCE_NAME="$(/usr/share/google/get_metadata_value attributes/dataproc-master)"
readonly MASTER_INSTANCE_ZONE="$(/usr/share/google/get_metadata_value zone)"
readonly MAX_IDLE_SECONDS_KEY="${MY_CLUSTER_NAME}_maxIdleSeconds"
readonly DATAPROC_PERSIST_DIAG_TARBALL_KEY="${MY_CLUSTER_NAME}_persistDiagnosticTarball"
readonly KEY_PROCESS_LIST_KEY="${MY_CLUSTER_NAME}_keyProcessList"
readonly MACHINE_ROLE=$(/usr/share/google/get_metadata_value attributes/dataproc-role)
readonly MASTER_NAME="$(/usr/share/google/get_metadata_value attributes/dataproc-master)"
readonly CLUSTER_NAME="$(/usr/share/google/get_metadata_value attributes/dataproc-cluster-name)"
readonly PERSIST_DIAG_TARBALL_TRUE="TRUE"
readonly PERSIST_DIAG_TARBALL_FALSE="FALSE"
readonly SCRIPT_STORAGE_LOCATION=$(/usr/share/google/get_metadata_value attributes/script_storage_location)
readonly MAX_IDLE_PARAMETER=$(/usr/share/google/get_metadata_value attributes/max-idle)
readonly DATAPROC_PERSIST_DIAG_TARBALL=$(/usr/share/google/get_metadata_value attributes/persist_diagnostic_tarball)
readonly KEY_PROCESS_LIST_PARAMETER=$(/usr/share/google/get_metadata_value attributes/key_process_list)

function checkMaster() {
  local isMaster="false"
  if [[ "${MACHINE_ROLE}" == 'Master' && "$MASTER_NAME" == "${CLUSTER_NAME}-m" ]]; then
    isMaster="true"
  fi
  echo "$isMaster"
}

function startIdleJobChecker() {

  gcloud logging write idle-check-log "${MY_CLUSTER_NAME}: attempting to start idle checker using: ${SCRIPT_STORAGE_LOCATION}" --severity=NOTICE
  if [[ -n ${SCRIPT_STORAGE_LOCATION} ]]; then
    
    # Get and validate the max idle parameter. Following line evaluates to nothing if not provided or properly formatted.
    parsedMaxIdleParameter=$( echo "${MAX_IDLE_PARAMETER}" | sed  -n '/^\([0-9]*\)\(s\|m\|h\|d\)$/p' | sed  's/^\([0-9]*\)\(s\|m\|h\|d\)$/\1\,\2/' )
    if [[ -n ${parsedMaxIdleParameter} ]]; then
      idleTimeUnit=${parsedMaxIdleParameter#*,}
      idleTimeAmount=${parsedMaxIdleParameter%,*}
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
      gcloud logging write idle-check-log "${MY_CLUSTER_NAME}: Idle time for cluster set to ${idleTimeAmountSeconds} " --severity=NOTICE
      gcloud compute instances add-metadata "${MASTER_INSTANCE_NAME} --zone ${MASTER_INSTANCE_ZONE} --metadata ${MAX_IDLE_SECONDS_KEY}=${idleTimeAmountSeconds}" &

      # Record preference for persisting diagnostic information on cluster shutdown
      persistDiagnosticTarball=${PERSIST_DIAG_TARBALL_FALSE}
      parsedPesistDiagnosticTarballParameter=$(echo "${DATAPROC_PERSIST_DIAG_TARBALL}" | sed -n '/\(TRUE\|true\)/p' )
      if [[ -n ${parsedPesistDiagnosticTarballParameter} ]]; then
        persistDiagnosticTarball=${PERSIST_DIAG_TARBALL_TRUE}
      fi
      gcloud logging write idle-check-log "${MY_CLUSTER_NAME}: Request to persist diagnostic tarbeall - ${persistDiagnosticTarball} " --severity=NOTICE
      gcloud compute instances add-metadata "${MASTER_INSTANCE_NAME}" --zone "${MASTER_INSTANCE_ZONE}" --metadata "${DATAPROC_PERSIST_DIAG_TARBALL_KEY}=${persistDiagnosticTarball}" &

      # Record key process list parameter
      keyProcessListParam=${KEY_PROCESS_LIST_PARAMETER}
      gcloud logging write idle-check-log "${MY_CLUSTER_NAME}: Key non-yarn processes to monitor - ${keyProcessListParam} " --severity=NOTICE
      gcloud compute instances add-metadata "${MASTER_INSTANCE_NAME}" --zone "${MASTER_INSTANCE_ZONE}" --metadata "${KEY_PROCESS_LIST_KEY}=${keyProcessListParam}" &


      gcloud logging write idle-check-log "${MY_CLUSTER_NAME}: Establishing idle-check process to determine when master node can be deleted" --severity=NOTICE
      cd /root || exit
      mkdir DataprocShutdown
      cd DataprocShutdown || exit

      # copy the script from GCS
      gcloud storage cp "${SCRIPT_STORAGE_LOCATION}/idle-check.sh" .
      # make it executable
      chmod 700 idle-check.sh
      # run IsIdle script
      ./idle-check.sh

      #sudo bash -c 'echo "" >> /etc/crontab'
      sudo bash -c 'echo "*/5 * * * * root /root/DataprocShutdown/idle-check.sh" >> /etc/crontab' &
    else
      gcloud logging write idle-check-log "Must provide value for 'max-idle' The duration from the moment when the cluster enters the idle state to the moment when the cluster starts to delete. Provide the duration in IntegerUnit format, where the unit can be 's, m, h, d' (seconds, minutes, hours, days, respectively)." --severity=NOTICE
      exit 1;
    fi
  else
    gcloud logging write idle-check-log "${MY_CLUSTER_NAME}: Value for STORAGE_LOCATION is required" --severity=NOTICE
    exit 1;
  fi
}

function main() {
  is_master_node=$(checkMaster)
  gcloud logging write idle-check-log "${MY_CLUSTER_NAME}: Is master is $is_master_node" --severity=NOTICE
  if [[ "$is_master_node" == "true" ]]; then
    startIdleJobChecker
  fi
}

main "$@"
