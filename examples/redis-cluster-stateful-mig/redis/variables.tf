# Copyright 2024 Google LLC
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

variable "hostname" {
  description = "The base name for instances in the MIG."
  type        = string
}

variable "project_id" {
  description = "The ID of the project where the MIG will be created."
  type        = string
}

variable "mig_name" {
  description = "The name of the MIG. If not provided, a default name will be used."
  type        = string
  default     = ""
}

variable "region" {
  description = "The region where the MIG will be created."
  type        = string
}

variable "target_pools" {
  description = "List of target pool URLs that instances in the MIG will belong to."
  type        = list(string)
  default     = []
}

variable "target_size" {
  description = "The target number of running instances in the MIG. Set to null for autoscaling."
  type        = number
  default     = null
}

variable "autoscaling_enabled" {
  description = "Whether autoscaling is enabled for the MIG."
  type        = bool
  default     = false
}

variable "wait_for_instances" {
  description = "Whether to wait for all instances to be created/updated before continuing."
  type        = bool
  default     = false
}

variable "healthchecks" {
  description = "Map of health check URLs and their associated initial delay seconds."
  type = map(object({
    initial_delay_sec = number
  }))
  default = {}
}

variable "stateful_disks" {
  description = "List of stateful disks with device names and optional delete rules."
  type = list(object({
    device_name = string
    delete_rule = optional(string)
  }))
  default = [
    {
      device_name = "data-disk"
      delete_rule = "ON_PERMANENT_INSTANCE_DELETION"
    }
  ]
}

variable "distribution_policy_zones" {
  description = "List of zones where instances in the MIG will be distributed."
  type        = list(string)
}

variable "update_policy" {
  description = "Map of update policies for the MIG."
  type        = map(any)
  default     = {}
}

variable "mig_timeouts" {
  description = "Map of timeouts for MIG resource operations."
  type        = map(string)
  default = {
    create = "30m"
    update = "30m"
    delete = "30m"
  }
}

variable "redis_service_account_name" {
  description = "service account attached to redis compute engines  "
  type        = string
  default     = "example-redis"
}

variable "subnetwork" {
  type = string
}

variable "machine_type" {
  type = string
}

variable "image" {
  type = object({
    family  = string
    project = string
  })
  default = {
    family  = "debian-11"
    project = "debian-cloud"
  }
}

variable "persistent_disk" {
  type = list(object({
    device_name  = optional(string)
    auto_delete  = optional(bool)
    boot         = optional(bool)
    disk_size_gb = optional(number)
    delete_rule  = optional(string)
  }))
  default = [{
    device_name  = "data-disk"
    auto_delete  = false
    boot         = false
    disk_size_gb = 40
    delete_rule  = "ON_PERMANENT_INSTANCE_DELETION"
  }]
}