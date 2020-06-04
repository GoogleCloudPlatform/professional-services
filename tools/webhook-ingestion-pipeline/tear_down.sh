#!/bin/bash

# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Destroy Deployment
cd terraform/ || exit
terraform destroy -auto-approve

cd .. || exit

# Tear Down Dataflow
DF_JOBS=$(gcloud dataflow jobs list --status=active --region="${REGION}" --project="${PROJECT_ID}" | grep 'webhook-job-' | awk '{print $1;}')
gcloud dataflow jobs cancel "${DF_JOBS}" --region="${REGION}" --project="${PROJECT_ID}"
