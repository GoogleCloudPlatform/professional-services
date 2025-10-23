# Copyright 2025 Google LLC
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

output "url" {
  description = "The default URL of the Firebase Hosting site."
  value       = google_firebase_hosting_site.this.default_url
}

output "site_id" {
  description = "The ID of the Firebase Hosting site."
  value       = google_firebase_hosting_site.this.site_id
}

output "trigger_sa_email" {
  description = "The email of the service account used by the build trigger."
  value       = google_service_account.trigger_sa.email
}
