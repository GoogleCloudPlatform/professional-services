/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

output "cf_logs" {
  description = "Cloud Function logs read command."
  value       = <<END
gcloud logging read '
  logName="projects/${var.project_id}/logs/cloudfunctions.googleapis.com%2Fcloud-functions" AND
  resource.labels.function_name="${var.name}"' \
  --project ${var.project_id} \
  --format "value(severity, timestamp, textPayload)" \
  --limit 10
  END
}

output "subscription_pull" {
  description = "Subscription pull command."
  value       = <<END
gcloud pubsub subscriptions pull ${var.name}-default \
  --auto-ack \
  --format "value(message.data)" \
  --project ${module.project.project_id}
  END
}

output "tag_add" {
  description = "Instance add tag command."
  value       = <<END
gcloud compute instances add-tags ${var.name}-1 \
  --project ${module.project.project_id} \
  --zone ${var.region}-b \
  --tags foobar
  END
}

output "tag_show" {
  description = "Instance add tag command."
  value       = <<END
gcloud compute instances describe ${var.name}-1 \
  --project ${module.project.project_id} \
  --zone ${var.region}-b \
  --format 'yaml(tags)'
  END
}
