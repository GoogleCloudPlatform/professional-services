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

. edgenode_env

set -x
set -e

# Override target cluster with command-line argument
if [ $# -gt 0 ]; then
  TARGET_CLUSTER=$1
fi

gcloud compute --project="${PROJECT}" instances create "${INSTANCE_NAME}" \
 --async \
 --no-address \
 --machine-type="${MACHINE_TYPE}" \
 --zone="${ZONE}" \
 --subnet="${SUBNET}" \
 --service-account="${SERVICE_ACCOUNT}" \
 --scopes="https://www.googleapis.com/auth/devstorage.read_write" \
 --tags="${CLIENT_TAGS}" \
 --image-project="${IMAGE_PROJECT}" \
 --image-family="${IMAGE_FAMILY}" \
 --boot-disk-size="${BOOT_DISK_SIZE}" \
 --boot-disk-type="${BOOT_DISK_TYPE}" \
 --metadata="target-dataproc-cluster=${TARGET_CLUSTER}"

sleep 5

gcloud compute --project="${PROJECT}" \
  instances describe "${INSTANCE_NAME}" \
  --zone="${ZONE}" | grep -E 'status|networkIP'
