#!/bin/bash
# Copyright 2023 Google LLC
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

gcloud iam service-accounts create autopsc-system --display-name "autopsc" --project "${GOOGLE_CLOUD_PROJECT}"
gcloud iam service-accounts add-iam-policy-binding \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:${GOOGLE_CLOUD_PROJECT}.svc.id.goog[autopsc-system/autopsc-controller-manager]" \
  "autopsc-system@${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com"

gcloud iam roles create autopsc --project "${GOOGLE_CLOUD_PROJECT}" \
  --permissions=compute.serviceAttachments.create,compute.serviceAttachments.get,compute.serviceAttachments.list,compute.serviceAttachments.delete,compute.serviceAttachments.update,compute.subnetworks.use,compute.regionOperations.get,compute.forwardingRules.use
gcloud projects add-iam-policy-binding \
  --role "projects/${GOOGLE_CLOUD_PROJECT}/roles/autopsc" \
  --member "serviceAccount:autopsc-system@${GOOGLE_CLOUD_PROJECT}.iam.gserviceaccount.com" \
  "${GOOGLE_CLOUD_PROJECT}"
