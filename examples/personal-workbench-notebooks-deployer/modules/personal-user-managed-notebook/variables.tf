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

variable "user_managed_instance_prefix" {
  type        = string
  default     = "user-managed-instance"
  description = "Prefix to be used to create the name of the user managed notebook instances."
}

variable "personal_dataproc_notebooks_bucket_name" {
  type        = string
  default     = "personal_dataproc_notebooks"
  description = "GCS bucket to be created for: 1. To upload the master dataproc templates you define in local folder: dataproc_master_templates. 2. To write the generated dataproc templates for each end-user. 3. To upload notebook and dataproc initialization scripts."
}

variable "master_templates_path_name" {
  description = "Path name in local project to be replicated in GCS bucket storing Dataproc Yaml template files."
  type        = string
  default     = "dataproc_master_templates"
}

variable "dataproc_yaml_template_file_name" {
  description = "Template name to be used as the available template for users to create their Dataproc clusters. Should be located in master_templates_path_name"
  default     = "per-auth-cluster.yaml"
  type        = string
}

variable "generated_templates_path_name" {
  description = "SubNetwork name to deploy notebook instances to"
  default     = "dataproc_generated_templates"
  type        = string
}

variable "machine_type" {
  type        = string
  default     = "e2-medium"
  description = "A reference to a machine type which defines notebooks VM kind."
}

variable "zone" {
  description = "Zone where the resources will be created."
  default     = "us-central1-a"
  type        = string
}

variable "region" {
  description = "Region where the resources will be created."
  default     = "us-central1"
  type        = string
}

variable "no_public_ip" {
  description = "To restrict or not public IP on notebook instances."
  default     = false
  type        = string
}

variable "networking_tags" {
  description = "Networking tags to be used by notebook instances."
  default     = []
  type        = set(string)
}

variable "service_acct_roles" {
  description = "Roles for Service account on the notebooks VMs to call Google Cloud APIs. Needs at least this role https://cloud.google.com/iam/docs/understanding-roles#dataproc.hubAgent"
  default     = ["roles/compute.admin", "roles/dataproc.hubAgent", "roles/storage.objectAdmin"]
  type        = set(string)
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