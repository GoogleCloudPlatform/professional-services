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

variable "gcp_project_id" {
  type        = string
  description = "The GCP Project ID where the secrets will be created."
}

variable "secret_names" {
  type        = list(string)
  description = "A list of secret IDs to create (e.g., [\"FIREBASE_API_KEY\", \"GOOGLE_CLIENT_ID\"])."
}

variable "accessor_sa_email" {
  type        = string
  description = "The email of the service account that will be granted accessor permission."
}
