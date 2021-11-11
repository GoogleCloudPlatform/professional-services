# Copyright 2019 Google Inc.
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


# REQUIRED TO EDIT:
variable project_id {
  description = "Your newly created project ID"
}

# REQUIRED TO EDIT:
variable billing_export_table_path {
  description = "Path to the exported billing table in BigQuery in the format of project.dataset.table"
}

# REQUIRED TO EDIT:
variable billing_export_location {
  description = "The location of your exported billing dataset, either US or EU"
}

# REQUIRED TO EDIT:
variable corrected_dataset_id {
  description = "New dataset that will hold the corrected CUD table and the commitment mapping table."
  default     = "cud_corrected_dataset"
}

# REQUIRED TO EDIT:
variable commitment_table_path {
  description = "New table that holds the upload of the commitment mappings in format project.dataset.table."
}

# OPTIONAL TO EDIT:
variable enable_cud_cost_attribution {
  description = "Boolean to perform cost attribution on a per-resource level, in additon to credits."
  default     = "false"
}

# OPTIONAL TO EDIT:
variable cud_cost_attribution_option {
  description = "The type of cost attribution to perform if enable_cud_cost_attribution is true. Option a: All the cost is attributed within the scope. Option b:If a project that is not part of the scope gets any cud, it also incures the cost. Remaining cost (of any unallocated commit) is attributed within the scope."
  default     = "a"
}

# OPTIONAL TO EDIT:
variable corrected_table_name {
  description = "The new billing table that we will create with the corrected CUD cost."
  default     = "corrected_billing_export_table"
}

# OPTIONAL TO EDIT:
variable region {
  description = "The Compute Engine region for Composer to run in: us-central1 or europe-west1"
  default     = "us-central1"
}

# OPTIONAL TO EDIT:
variable zone {
  description = "The Compute Engine zone: us-central1-f or europe-west1-b"
  default     = "us-central1-f"
}

variable composer_dir_path {
  description = "Path to composer DAG files"
  default = "../composer/"
}