#!/bin/bash
# Copyright 2022 Google LLC
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


set -e

echo "START: Connecting to proxy"

# avoid hitting issue with login profile size
# (https://github.com/kyma-project/test-infra/issues/93)
for i in $(gcloud compute os-login ssh-keys list | grep -v FINGERPRINT); do echo "$i"; gcloud compute os-login ssh-keys remove --key "$i"; done

gcloud compute ssh \
  --project="$PROJECT_ID" \
  --zone="$ZONE" \
  --tunnel-through-iap "$PROXY_SERVER" \
  -- -L 0.0.0.0:"$PORT":localhost:"$PORT" -Nqf
  # tail tinyproxy log only works for local
  # --command='sudo tail -f /var/log/tinyproxy/tinyproxy.log' \

echo "SUCCESS: Connected to proxy"

# keep container running in background
while :
do
  sleep 5
done
