#!/usr/bin/env bash

# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


if [ -z "$1" ] || [ -z "$2" ]
then
    echo "Usage ./deploy.sh <admin-email> <service-account-email>"
    exit 1
fi

gcloud functions deploy gsuite-exporter \
    --runtime python37 \
    --trigger-topic gsuite-exporter-schedule \
    --entry-point sync_log \
    --service-account "$2" \
    --set-env-vars ADMIN_USER="$1"

gcloud scheduler jobs create pubsub gsuite-log-export-scheduler \
    --schedule="*/15 * * * *" \
    --topic=gsuite-exporter-schedule \
    --message-body="{}"

