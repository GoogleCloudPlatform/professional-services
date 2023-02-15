# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

output "bucket" {
  description = "GCS Bucket URL."
  value       = module.bucket.url
}

output "dataset" {
  description = "GCS Bucket URL."
  value       = module.dataset.id
}

output "notebook" {
  description = "Vertex AI notebook details."
  value = {
    name = resource.google_notebooks_instance.playground.name
    id   = resource.google_notebooks_instance.playground.id
  }
}

output "project" {
  description = "Project id"
  value       = module.project.project_id
}

output "vpc" {
  description = "VPC Network"
  value       = module.vpc.name
}
