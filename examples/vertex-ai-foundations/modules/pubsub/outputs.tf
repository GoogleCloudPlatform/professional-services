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

output "id" {
  description = "Topic id."
  value       = google_pubsub_topic.default.id
  depends_on = [
    google_pubsub_topic_iam_binding.default
  ]
}

output "subscription_id" {
  description = "Subscription ids."
  value = {
    for k, v in google_pubsub_subscription.default : k => v.id
  }
  depends_on = [
    google_pubsub_subscription_iam_binding.default
  ]
}

output "subscriptions" {
  description = "Subscription resources."
  value       = google_pubsub_subscription.default
  depends_on = [
    google_pubsub_subscription_iam_binding.default
  ]
}

output "topic" {
  description = "Topic resource."
  value       = google_pubsub_topic.default
  depends_on = [
    google_pubsub_topic_iam_binding.default
  ]
}
