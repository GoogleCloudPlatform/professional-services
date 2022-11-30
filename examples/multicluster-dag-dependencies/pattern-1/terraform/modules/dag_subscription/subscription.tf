# Copyright 2022 Google Inc.
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

resource "google_pubsub_subscription" "workflow_status_subscriptions_4_success" {
  project = var.project_id
  for_each = toset(var.subscriptions)
  name  = replace(each.key, ",","-")
  topic = var.topic

  labels = {
    source_dag_id = split(",",each.key)[0]
    target_dag_id = split(",",each.key)[1]
    on_status = split(",",each.key)[2]
  }
  filter = "${format("attributes.source_type = \"composer\" AND attributes.workflow_id = \"%s\" AND attributes.workflow_status = \"%s\"", split(",",each.key)[0], split(",",each.key)[2])}"
}
