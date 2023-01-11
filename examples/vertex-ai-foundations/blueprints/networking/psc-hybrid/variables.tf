/**
 * Copyright 2022 Google LLC
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

variable "prefix" {
  description = "Prefix to use for resource names."
  type        = string
}

variable "project_id" {
  description = "When referncing existing projects, the id of the project where resources will be created."
  type        = string
}

variable "region" {
  description = "Region where resources will be created."
  type        = string
}

variable "zone" {
  description = "Zone where resources will be created."
  type        = string
}

variable "dest_ip_address" {
  description = "On-prem service destination IP address."
  type        = string
}

variable "dest_port" {
  description = "On-prem service destination port."
  type        = string
  default     = "80"
}

variable "project_create" {
  description = "Whether to automatically create a project."
  type        = bool
  default     = false
}

variable "vpc_create" {
  description = "Whether to automatically create VPCs."
  type        = bool
  default     = true
}

variable "vpc_config" {
  description = "VPC and subnet ids, in case existing VPCs are used."
  type = object({
    producer = object({
      id              = string
      subnet_main_id  = string
      subnet_proxy_id = string
      subnet_psc_id   = string
    })
    consumer = object({
      id             = string
      subnet_main_id = string
    })
  })
  default = {
    producer = {
      id              = "xxx"
      subnet_main_id  = "xxx"
      subnet_proxy_id = "xxx"
      subnet_psc_id   = "xxx"
    }
    consumer = {
      id             = "xxx"
      subnet_main_id = "xxx"
    }
  }
}

variable "producer" {
  description = "Producer configuration."
  type = object({
    subnet_main     = string      # CIDR
    subnet_proxy    = string      # CIDR
    subnet_psc      = string      # CIDR
    accepted_limits = map(number) # Accepted project ids => PSC endpoint limit
  })
}

variable "subnet_consumer" {
  description = "Consumer subnet CIDR."
  type        = string # CIDR
}
