/*
 * Copyright 2018 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
resource "google_service_account" "publisher" {
  project = "${google_project.project.project_id}"
  account_id   = "mypublisher"
  display_name = "My PubSub Publisher"
}

resource "google_project_iam_member" "publisher_role" {
  project = "${google_project.project.project_id}"
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.publisher.email}"
}

resource "google_service_account_key" "publisher_key" {
  service_account_id = "${google_service_account.publisher.name}"
}

resource "local_file" "publisher_key" {
    content     = "${base64decode(google_service_account_key.publisher_key.private_key)}"
    filename    = "${path.module}/publisher-key.json"
}

resource "google_service_account" "subscriber" {
  project = "${google_project.project.project_id}"
  account_id   = "mysubscriber"
  display_name = "My PubSub Subscriber"
}

resource "google_project_iam_member" "subscriber_role" {
  project = "${google_project.project.project_id}"
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.subscriber.email}"
}

output "publisher service account" {
 value = "${google_service_account.publisher.email}"
}


output "subsciber service account" {
 value = "${google_service_account.subscriber.email}"
}
