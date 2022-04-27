# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#


##################################################
##               Project Level                  ##
##################################################


resource "google_project_iam_member" "df_worker_project_iam" {
  for_each = toset(var.df_worker_project_permissions)
  project  = var.project
  role     = each.key
  member   = local.df_member
}

##################################################
##               Resource Level                 ##
##################################################

# See: https://cloud.google.com/dataflow/docs/concepts/access-control#creating_jobs
resource "google_storage_bucket_iam_binding" "df_bucket_iam" {
  bucket = google_storage_bucket.df_bucket.name
  role   = "roles/storage.admin"
  members = [local.df_member]
}

resource "google_pubsub_subscription_iam_member" "df_subscription_iam" {
  project      = var.project
  subscription = google_pubsub_subscription.input_sub.name
  role         = "roles/pubsub.subscriber"
  member       = local.df_member
}

resource "google_pubsub_topic_iam_member" "df_topic_iam" {
  project = var.project
  topic   = google_pubsub_topic.output_topic.name
  role    = "roles/pubsub.publisher"
  member  = local.df_member
}

resource "google_secret_manager_secret_iam_member" "df_secret_iam" {
  provider = google-beta

  project   = var.project
  secret_id = google_secret_manager_secret.hash_key_secret.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = local.df_member
}

