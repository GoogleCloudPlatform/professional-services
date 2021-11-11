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
readonly MY_REGION="$(/usr/share/google/get_metadata_value attributes/dataproc-region)"
readonly MAX_IDLE_SECONDS_KEY="${MY_CLUSTER_NAME}_maxIdleSeconds"
readonly DATAPROC_PERSIST_DIAG_TARBALL_KEY="${MY_CLUSTER_NAME}_persistDiagnosticTarball"
readonly IS_IDLE_STATUS_KEY="${MY_CLUSTER_NAME}_isIdle"
readonly IS_IDLE_STATUS_SINCE_KEY="${MY_CLUSTER_NAME}_isIdleStatusSince"
readonly IS_IDLE_STATUS_TRUE="TRUE"
readonly IS_IDLE_STATUS_FALSE="FALSE"
readonly PERSIST_DIAG_TARBALL_TRUE="TRUE"
readonly KEY_PROCESS_LIST_KEY="${MY_CLUSTER_NAME}_keyProcessList"
# readonly KEY_PROCESS_LIST_EMPTY="EMPTY"

isActiveSSH()
{
   local isActiveSSHSession=0
   woutput=$( w )
   gcloud logging write idle-check-log "${MY_CLUSTER_NAME} (SSH Session Check): ${woutput}" --severity=NOTICE
   woutrow=$(w | wc -l)
   if [[ "$woutrow" -gt 2 ]]; then
     sec=$(w | awk 'NR > 2 { print $5 }')
     for i in $sec
       do
         if [[ $i == *.* ]]; then
           isActiveSSHSession=1
           break
         elif [[ $i == *:*m ]]; then
   				   continue
         elif [[ $i == *:* ]]; then
           arrTime=( "${i//:/ }" )
           if [[ "${arrTime[0]}"  -lt 30 ]]; then
             isActiveSSHSession=1
             break
           fi
         fi
       done
    fi

   echo "$isActiveSSHSession"
}

isKeyProcessActive()
{
   local isKeyProgramActive=0
   keyProcessList="$(/usr/share/google/get_metadata_value attributes/"${KEY_PROCESS_LIST_KEY}" || echo 'python')"
   gcloud logging write idle-check-log "${MY_CLUSTER_NAME} (Key Process Checklist): ${keyProcessList}" --severity=NOTICE
   IFS=';'
   processes=$(w | awk 'NR > 2 { print $8 }')
   for process in $keyProcessList
      do
        for i in $processes
           do
              if [[ $i == "$process" ]]; then
                 gcloud logging write idle-check-log "${MY_CLUSTER_NAME} (Key Process Found Active): ${process}" --severity=NOTICE
                 isKeyProgramActive=1
                 break
              fi
            done
       if [[ $isKeyProgramActive -eq 1 ]]; then
          break
       fi
   done         

   echo "$isKeyProgramActive"
}

yarnAppsRunningOrJustFinished()
{
  local isYarnAppRunningOrJustFinishedResult=0
  appNames=$( curl -s "http://localhost:8088/ws/v1/cluster/apps?state=RUNNING"| grep -Po '"name":.*?[^\\]",')
  gcloud logging write idle-check-log "${MY_CLUSTER_NAME} (Active YARN Job Check): ${appNames}" --severity=NOTICE
  if [[ -n $appNames ]]; then
    # something is running
    isYarnAppRunningOrJustFinishedResult=1
  else
    jobFinishedTime=$( curl -s "http://localhost:8088/ws/v1/cluster/apps?state=FINISHED"|grep -Po '"finishedTime":.*?[^\\]"' | sort | tail -n 1 | sed 's/\"finishedTime\":\(.*\),\"/\1/' )
    gcloud logging write idle-check-log "${MY_CLUSTER_NAME} (Recently Completed YARN Job Check): ${jobFinishedTime}" --severity=NOTICE
    if [[ -n $jobFinishedTime ]]; then
      currentTime=$(($(date +%s%N)/1000000))
      appMPH=60000
      idleTime=$(( (currentTime - jobFinishedTime) / appMPH ))
      if [[ $idleTime -lt 30 ]]; then
        isYarnAppRunningOrJustFinishedResult=1
      fi
    fi
  fi

  echo "$isYarnAppRunningOrJustFinishedResult"
}

setIdleStatusIdle() {
  # Sets the isIdle metadata status and returns the timestamp of how long ago it was set to idle
  currentTime=$(($(date +%s%N)/1000000))
  local isIdleStatusSince=0

  # Get current isIdleStatus
  lastIdleStatus="$(/usr/share/google/get_metadata_value attributes/"${IS_IDLE_STATUS_KEY}" || echo 'FALSE')"
  if [[ "$lastIdleStatus" == "${IS_IDLE_STATUS_TRUE}"  ]]; then
    # Use the existing time stamp marking when cluster became idle 
    isIdleStatusSince="$(/usr/share/google/get_metadata_value attributes/"${IS_IDLE_STATUS_SINCE_KEY}" || echo 'FALSE')"
  else
    #Set isIdle to true and update the time
    gcloud compute instances add-metadata "${MASTER_INSTANCE_NAME}" --zone "${MASTER_INSTANCE_ZONE}" --metadata "${IS_IDLE_STATUS_KEY}=${IS_IDLE_STATUS_TRUE},${IS_IDLE_STATUS_SINCE_KEY}=${currentTime}"
    isIdleStatusSince=$currentTime
  fi

  echo "$isIdleStatusSince"
}

shutdownCluster() {
  gcloud logging write idle-check-log "${MY_CLUSTER_NAME}: Shutting Down Cluster" --severity=NOTICE
  
  # Write out diagnostics if requested
  persistDiagnosticTarball="$(/usr/share/google/get_metadata_value attributes/"${DATAPROC_PERSIST_DIAG_TARBALL_KEY}" || echo 'FALSE')"
  if [[ "$persistDiagnosticTarball" == "${PERSIST_DIAG_TARBALL_TRUE}"  ]]; then
    gcloud dataproc clusters diagnose "${MY_CLUSTER_NAME}" --region="${MY_REGION}"
  fi
      
  # Remove the metadata
  gcloud compute instances remove-metadata remove-metadata --keys "${IS_IDLE_STATUS_KEY},${IS_IDLE_STATUS_SINCE_KEY},${MAX_IDLE_SECONDS_KEY},${DATAPROC_PERSIST_DIAG_TARBALL_KEY},${KEY_PROCESS_LIST_KEY},"

  # Shutdown the cluster
  gcloud dataproc clusters delete "${MY_CLUSTER_NAME}" --quiet --region="${MY_REGION}"
}

checkForClusterError()
{
  local isClusterErrorResult=0
  # Fetch clusters with this name and a status of ERROR
  clusterList=$( gcloud dataproc clusters list --region="${MY_REGION}" --filter="clusterName = ${MY_CLUSTER_NAME} AND status.state = ERROR" | grep ERROR )

  if [[ -n $clusterList ]]; then
    # the cluster is in an error state
    isClusterErrorResult=1
  fi

  echo "$isClusterErrorResult"
}

function main() {
  # echo "Starting Script"
  #rightNow=$(($(date +%s%N)/1000000))

  # echo "About to call check for active SSH sessions"
  isActiveSSHResult=$(isActiveSSH)
  gcloud logging write idle-check-log "${MY_CLUSTER_NAME} (Active SSH Session): ${isActiveSSHResult}" --severity=NOTICE
  # echo "isActiveSSHResult is ${isActiveSSHResult}"

  # echo "About to call check for active key processes"
  isKeyProcessActiveResult=$(isKeyProcessActive)
  gcloud logging write idle-check-log "${MY_CLUSTER_NAME} (Key Process Active): ${isKeyProcessActiveResult}" --severity=NOTICE
  
  # echo "About to call check for active/recent YARN jobs"
  isYarnAppRunningOrJustFinishedResult=$(yarnAppsRunningOrJustFinished)
  gcloud logging write idle-check-log "${MY_CLUSTER_NAME} (Active/Recent YARN Jobs): ${isYarnAppRunningOrJustFinishedResult}" --severity=NOTICE

  # echo "YARN results are ${isYarnAppRunningOrJustFinishedResult}"
  currentTime=$(($(date +%s%N)/1000000))

  # First check the state of the cluster and shutdown if appropriate. Otherwise check for an idle cluster.
  isClusterError=$(checkForClusterError)
  if [[ ( $isClusterError -eq 1 ) ]]; then
    gcloud logging write idle-check-log "${MY_CLUSTER_NAME}: Cluster Error" --severity=NOTICE
    shutdownCluster
  elif [[ ( $isActiveSSHResult -eq 0 ) && ( $isKeyProcessActiveResult -eq 0 ) && ( $isYarnAppRunningOrJustFinishedResult -eq 0 ) ]]; then
    gcloud logging write idle-check-log "${MY_CLUSTER_NAME}: Cluster Is IDLE" --severity=NOTICE
    #Set project metadata variable isIdle to TRUE
    isIdleSince=$(setIdleStatusIdle)
    appSPH=1000
    currentIdleSeconds=$(( (currentTime - isIdleSince) / appSPH))
    maxIdleSeconds="$(/usr/share/google/get_metadata_value attributes/"${MAX_IDLE_SECONDS_KEY}" || echo 'FALSE')"
    if [[ $currentIdleSeconds -gt $maxIdleSeconds ]]; then
      shutdownCluster
    fi
  else
    echo "Considering cluster ${MY_CLUSTER_NAME}  as active"
    gcloud logging write idle-check-log "${MY_CLUSTER_NAME}: Cluster Is ACTIVE" --severity=NOTICE
    #echo $( gcloud compute instances add-metadata ${MASTER_INSTANCE_NAME} --zone ${MASTER_INSTANCE_ZONE} --metadata ${IS_IDLE_STATUS_KEY}=${IS_IDLE_STATUS_FALSE},${IS_IDLE_STATUS_SINCE_KEY}=${currentTime})
    gcloud compute instances add-metadata "${MASTER_INSTANCE_NAME}" --zone "${MASTER_INSTANCE_ZONE}" --metadata "${IS_IDLE_STATUS_KEY}=${IS_IDLE_STATUS_FALSE},${IS_IDLE_STATUS_SINCE_KEY}=${currentTime}"
  fi

  exit 0
}
main "$@"
