# Copyright 2023 Google LLC
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

variable "project_id" {
  description = "Project ID where all the resources will be created. We assume this project already exists."
  type        = string
}

variable "notebook_users_list" {
  type        = set(string)
  description = "Set of notebook users, for each user a notebook instance and a dataproc cluster personal auth cluster template will be created."
}

variable "managed_instance_prefix" {
  type        = string
  default     = "managed-instance"
  description = "Prefix to be used to create the name of the managed notebook instances."
}

variable "machine_type" {
  type        = string
  default     = "n1-standard-4"
  description = "A reference to a machine type which defines notebooks VM kind."
}

variable "region" {
  description = "Region where the resources will be created."
  default     = "us-central1"
  type        = string
}

variable "network_name" {
  description = "Network name to deploy notebook instances to."
  default     = "default"
  type        = string
}
variable "sub_network_name" {
  description = "SubNetwork name to deploy notebook instances to"
  default     = "default"
  type        = string
}