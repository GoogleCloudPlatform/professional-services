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


variable "billing_account" {
  description = "Billing account id used as default for new projects."
  type        = string
}

variable "location" {
  description = "The location where resources will be deployed."
  type        = string
  default     = "europe"
}

variable "project_kms_name" {
  description = "Name for the new KMS Project."
  type        = string
  default     = "my-project-kms-001"
}

variable "project_service_name" {
  description = "Name for the new Service Project."
  type        = string
  default     = "my-project-service-001"
}

variable "region" {
  description = "The region where resources will be deployed."
  type        = string
  default     = "europe-west1"
}

variable "root_node" {
  description = "The resource name of the parent Folder or Organization. Must be of the form folders/folder_id or organizations/org_id."
  type        = string
}

variable "vpc_ip_cidr_range" {
  description = "Ip range used in the subnet deployef in the Service Project."
  type        = string
  default     = "10.0.0.0/20"
}

variable "vpc_name" {
  description = "Name of the VPC created in the Service Project."
  type        = string
  default     = "local"
}

variable "vpc_subnet_name" {
  description = "Name of the subnet created in the Service Project."
  type        = string
  default     = "subnet"
}
