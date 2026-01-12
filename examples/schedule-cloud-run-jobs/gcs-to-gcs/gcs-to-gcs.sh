#!/bin/bash
set -eo pipefail

CLOUD_RUN_TASK_INDEX=${CLOUD_RUN_TASK_INDEX:=0}
CLOUD_RUN_TASK_ATTEMPT=${CLOUD_RUN_TASK_ATTEMPT:=0}

source=${GCS_SOURCE}
destination=${GCS_DESTINATION}
echo "Starting Task #${CLOUD_RUN_TASK_INDEX}, Attempt #${CLOUD_RUN_TASK_ATTEMPT}..."
echo "Source $source Destination $destination"
gcloud storage cp --recursive "$source" "$destination"
retVal=$?
if [[ $retVal -eq 0 ]] 
then
    echo "Completed Task # ${CLOUD_RUN_TASK_INDEX}."
else
    echo "Task #${CLOUD_RUN_TASK_INDEX}, Attempt #${CLOUD_RUN_TASK_ATTEMPT} failed."
fi