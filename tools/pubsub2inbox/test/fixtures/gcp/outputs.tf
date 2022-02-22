#   Copyright 2021 Google LLC
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
output "bucket" {
  value = google_storage_bucket.bucket.name
}

output "sa" {
  value = google_service_account.sa.email
}

output "sa_key" {
  value     = google_service_account_key.sa-key.private_key
  sensitive = true
}

output "project" {
  value = var.project_id
}
