#!/bin/bash
# Copyright 2019 Google LLC
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

function err() {
  TS=$(date +'%Y-%m-%dT%H:%M:%S%z')
  echo "[${TS}]: ${@}" >&2
  return 1
}

function await_shutdown() {
  local INSTANCE_NAME=$1
  local ZONE=$2
  [ $# -eq 2 ] || err "invalid args: await_shutdown <INSTANCE_NAME> <ZONE>"
  for ((i = 0; i < 60; i++)); do
    echo "Waiting for ${INSTANCE_NAME} termination... (STATUS=${STATUS})"
    sleep 30
    local STATUS=$(gcloud compute instances describe "${INSTANCE_NAME}" \
      --zone="${ZONE}" 2>/dev/null | grep status | awk {'print $2'})
    [ "$STATUS" == "TERMINATED" ] && return 0
  done
  err "Timed out waiting for instance termination"
}

set -x
set -e

. image_env

gsutil ls "gs://${BUCKET}" >/dev/null 2>&1
e=$?
if [ $e -ne 0 ]; then
  gsutil mb -p "${PROJECT}" -c "${STORAGE_CLASS}" "gs://${BUCKET}"
fi

FILES=$(ls util)
for f in $FILES; do
  gsutil -m cp "util/${f}" "gs://${BUCKET}/"
done

if [ ! -z "$DATAPROC_VERSION" ]; then
  IMAGE="--image-version $DATAPROC_VERSION"
else
  IMAGE="--image projects/${SRC_IMAGE_PROJECT}/global/images/${SRC_IMAGE_NAME}"
fi

if [ ! -z "$OPTIONAL_COMPONENTS" ]; then
  COMPONENTS="--optional-components $OPTIONAL_COMPONENTS"
else
  COMPONENTS=""
fi

gcloud dataproc clusters create "${CLUSTER_NAME}" \
  --single-node \
  --no-address \
  --async \
  $IMAGE \
  --project "${PROJECT}" \
  --zone "${ZONE}" \
  --subnet "${SUBNET}" \
  --master-machine-type "${MACHINE_TYPE}" \
  --master-boot-disk-size "${BOOT_DISK_SIZE}" \
  --master-boot-disk-type "${BOOT_DISK_TYPE}" \
  --tags "${CLIENT_TAGS}" \
  $COMPONENTS \
  --service-account "${SERVICE_ACCOUNT}" \
  --metadata="config-bucket=${BUCKET},startup-script-url=gs://${BUCKET}/edge-node-startup-script.sh"

MASTER_INSTANCE="${CLUSTER_NAME}-m"

# Wait for Dataproc template cluster master to shutdown
await_shutdown "${MASTER_INSTANCE}" "${ZONE}"

# Capture image
gcloud compute images create "${DEST_IMAGE_FAMILY}-$(date +%Y%m%d%H%M)" \
  --family="${DEST_IMAGE_FAMILY}" \
  --project="${DEST_IMAGE_PROJECT}" \
  --source-disk="${MASTER_INSTANCE}" \
  --source-disk-zone="${ZONE}" \
  --description="dataproc edge node" \
  --labels="image-version=1-4"

# Cleanup Dataproc template cluster
echo -e "Y\n" | gcloud dataproc clusters delete "${CLUSTER_NAME}"
