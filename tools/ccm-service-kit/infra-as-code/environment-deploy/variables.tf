# Copyright 2022 Google LLC All Rights Reserved.
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
variable "project_id" {
  description = "Project ID where all this will be steup."
  type        = string
}

variable "region" {
  description = "Region where all this will be steup."
  type        = string
}


variable "zone" {
  description = "Zone where all this will be steup."
  type        = string
}

variable "service_account" {
  description = "Service account used by Composer"
  type        = string
}

variable "composer_instance_name" {
  description = "Composer Instance name"
  type        = string
}

variable "composer_image" {
  description = "Composer Image version"
  type        = string
  default     = "composer-2.0.7-airflow-2.2.3"
}

variable "composer_network_id" {
  description = "Network ID used by Composer Instance"
  type        = string
  default     = "default"
}

variable "composer_subnetwork_id" {
  description = "Subnetwork ID used by Composer Instance"
  type        = string
  default     = "default"
}

variable "composer_private_ip" {
  description = "Subnetwork ID used by Composer Instance"
  type        = bool
  default     = true
}

variable "files_path" {
    type = list(object({
        gcs_path = string
        local_file = string
    }))
}