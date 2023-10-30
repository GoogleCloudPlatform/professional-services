/**
 * Copyright 2023 Google LLC
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

output "bucket_self_link" {
  description = "Bucket created to store Dataproc templates (master and generated), and cluster and notebooks instances Initialization scripts"
  value       = google_storage_bucket.personal_dataproc_notebooks_bucket.self_link
}

output "notebook_instances" {
  description = "User managed notebook instances created."
  value = [
    for notebook in google_notebooks_instance.user_managed_instance : notebook.name
  ]
}