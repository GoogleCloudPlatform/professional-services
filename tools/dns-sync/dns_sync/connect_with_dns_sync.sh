#!/bin/bash

# Copyright 2017 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#            http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


# Will connect a GCE project to the dns-sync app engine application.
set -v

# Projct containing the DNS zone/push listener
DNS_PROJECT=${1}

# Project containing the GCE resources
GCE_PROJECT=${2}

# Similar to 'https://compute-engine-activity-dot-dns-sync-demo.appspot.com/push_notification?secret=my-shared-secret-key'
PUSH_ENDPOINT=${3}

# 1. Create the 'compute_engine_activity' topic in the GCE project.
gcloud --project "${GCE_PROJECT}" alpha pubsub topics create compute_engine_activity

# 2. Add the cloud-logs@system.gserviceaccount.com service account to the topic.
./add_topic_editor.py "${GCE_PROJECT}" compute_engine_activity

# 3. Create the compute_engine_activity Stackdriverlogging sink which will publish compute_engine_activity events to the compute_engine_activity topic.
gcloud --project "${GCE_PROJECT}" beta logging sinks create compute_engine_activity "pubsub.googleapis.com/projects/${GCE_PROJECT}/topics/compute_engine_activity" --log compute.googleapis.com/activity_log --output-version-format 'V1'

# 4. Create a push subscription in the dns-sync project for the compute_engine_activity topic which pushes to the endpoint
gcloud --project "${DNS_PROJECT}" alpha pubsub subscriptions create "${GCE_PROJECT}_push" --topic-project "${GCE_PROJECT}" --topic compute_engine_activity  --push-endpoint "${PUSH_ENDPOINT}"

# 5. Add the app engine service account as a project viewer in order to lookup GCE resources created.
gcloud projects add-iam-policy-binding "${GCE_PROJECT}" --member "serviceAccount:${DNS_PROJECT}@appspot.gserviceaccount.com" --role "roles/viewer"
