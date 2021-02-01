/**
 * Copyright 2021 Google LLC
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

variable "aggregation_period" {
  type        = string
  description = "Specify for what period of time to aggregate. Valid values are `month` and `day`."
  default     = "month"
}

variable "dataset_name" {
  type        = string
  description = "Name that the BigQuery dataset is going to have in the logs project (referenced by logs_project_id) where VPC flowlogs are going to be stored."
  default     = "vpc_flowlogs_dataset"
}

variable "exclude_interconnect_ip_ranges" {
  type        = list(string)
  description = "IP address ranges of VPC flowlog packets that should be ignored from ingestion into the BigQuery sink. These are useful if the included interconnect IP address ranges contain sub-ranges that should be ignored."
  default     = []
}

variable "include_interconnect_ip_ranges" {
  type        = list(string)
  description = "IP address ranges of VPC flowlog packets that should be ingested into the BigQuery sink. Only this ranges (minus any overlapping excluded ranges) will be used to calculate the total Interconnect traffic."
}

variable "location" {
  type        = string
  description = "GCP location, i.e. (multi-)region, where resources will be created. The list of all available values can be found under https://cloud.google.com/storage/docs/locations#available_locations."
  default     = "EU"
}

variable "logs_project_id" {
  type        = string
  description = "ID of the project where the BigQuery dataset with the VPC flowlogs will be stored."
}

variable "vpc_project_ids" {
  type        = set(string)
  description = "Set of project ids where a sink should be created and thus, VPC flowlogs should be ingested. This does not activate VPC flowlogs, it only ingests already activated VPC flowlogs."
}
