#!/usr/bin/env bash

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

kubectl create namespace twistlock

kubectl label namespace twistlock istio-injection- istio.io/rev=asm-173-6 --overwrite

# See documentation for generating bearer token:
# https://docs.paloaltonetworks.com/prisma/prisma-cloud/prisma-cloud-admin-compute/install/install_kubernetes.html
#
# Replace the below URL in the curl and twistcli statements with your Prisma Cloud (Twistlock) SaaS URL:
# https://docs.paloaltonetworks.com/prisma/prisma-saas/prisma-saas-admin/get-started-with-prisma-saas/prisma-saas/activate-prisma-saas.html
if [[ ! -f ./twistcli || $(./twistcli --version) != *"20.09.366"* ]]
    then
		curl --progress-bar -L -k --header "authorization: Bearer your-bearer-token" https://us-west1.cloud.twistlock.com/xx-xx-xxxxxxxx/api/v1/util/twistcli > twistcli;
		chmod +x twistcli;
fi
./twistcli defender install kubernetes --namespace twistlock --monitor-service-accounts --token your-bearer-token --address https://us-west1.cloud.twistlock.com/xx-xx-xxxxxxxx --cluster-address us-west1.cloud.twistlock.com
