# Copyright 2022 Google LLC All Rights Reserved.
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

resource "google_cloud_scheduler_job" "composer-scheduler-job" {
    project = var.project_id
    region = var.region
    name        = var.ccm-scheduler-trigger-name
    description = "trigger used to create composer instance"
    schedule    = var.ccm-scheduler-trigger-frecuency

    pubsub_target {
        # topic.id is the topic's full resource name.
        topic_name = google_pubsub_topic.ccm-trigger-pubsub.id
        data       = base64encode("test")
    }
}