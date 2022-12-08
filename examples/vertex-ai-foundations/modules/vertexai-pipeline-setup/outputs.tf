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

output "bucket_id" {
  description = "Bucket Id"
  value       = google_storage_bucket.pipeline_bucket.id
}

output "bucket_region" {
  description = "Bucket Region"
  value       = google_storage_bucket.pipeline_bucket.location
}

output "sa_id" {
  description = "Service Account Id"
  value       = google_service_account.pipeline_sa.account_id
}

output "sa_name" {
  description = "Service Account Name"
  value       = google_service_account.pipeline_sa.name
}
