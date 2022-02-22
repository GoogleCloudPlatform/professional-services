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

variable "dataset_name" {
  type        = string
  description = "Name that the BigQuery dataset is going to have in the logs project (referenced by logs_project_id) where VPC flowlogs are going to be stored."
  default     = "vpc_flowlogs_dataset"
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

variable "enable_split_by_destination" {
  type        = bool
  default     = true
  description = "If the report should show traffic split by target IP ranges"
}

variable "enable_split_by_protocol" {
  type        = bool
  default     = true
  description = "If the report should show traffic split by TCP/UDP protocol"
}

variable "enable_ipv4_traffic" {
  type        = bool
  default     = true
  description = "If IPv4 traffic should be show in the report. All traffic will be ingested into the dataset regardless of this setting."
}

variable "ipv4_ranges_to_include" {
  type        = list(string)
  default     = []
  description = "If enable_ipv4_traffic == true, IPv4 ranges to include. An empty list includes any range. All traffic will be ingested into the dataset regardless of this setting."
}

variable "ipv4_ranges_to_exclude" {
  type        = list(string)
  default     = []
  description = "If enable_ipv4_traffic == true, IPv4 ranges to exclude. All traffic will be ingested into the dataset regardless of this setting."
}

variable "enable_ipv6_traffic" {
  type        = bool
  default     = true
  description = "If IPv6 traffic should be show in the report. All traffic will be ingested into the dataset regardless of this setting."
}

variable "ipv6_ranges_to_include" {
  type        = list(string)
  default     = []
  description = "If enable_ipv6_traffic == true, IPv6 ranges to include. An empty list includes any range. All traffic will be ingested into the dataset regardless of this setting."
}

variable "ipv6_ranges_to_exclude" {
  type        = list(string)
  default     = []
  description = "If enable_ipv6_traffic == true, IPv6 ranges to exclude. All traffic will be ingested into the dataset regardless of this setting."
}

variable "ipv4_aggregate_prefix" {
  type        = number
  default     = 24
  description = "Prefix that will be used to aggregate traffic for IPv4 packets."
}

variable "ipv6_aggregate_prefix" {
  type        = number
  default     = 64
  description = "Prefix that will be used to aggregate traffic for IPv6 packets."
}