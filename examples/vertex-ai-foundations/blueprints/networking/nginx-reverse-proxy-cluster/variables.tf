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

variable "autoscaling" {
  description = "Autoscaling configuration for the instance group."
  type = object({
    min_replicas    = number
    max_replicas    = number
    cooldown_period = number
  })
  default = {
    min_replicas    = 1
    max_replicas    = 10
    cooldown_period = 30
  }
}

variable "autoscaling_metric" {
  type = object({
    name                       = string
    single_instance_assignment = number
    target                     = number
    type                       = string # GAUGE, DELTA_PER_SECOND, DELTA_PER_MINUTE
    filter                     = string
  })

  default = {
    name                       = "workload.googleapis.com/nginx.connections_current"
    single_instance_assignment = null
    target                     = 10 # Target 10 connections per instance, just for demonstration purposes
    type                       = "GAUGE"
    filter                     = null
  }
}

variable "backends" {
  description = "Nginx locations configurations to proxy traffic to."
  type        = string
  default     = <<-EOT
    location / {
      proxy_pass      http://10.0.16.58:80;
      proxy_http_version 1.1;
      proxy_set_header Connection "";
    }
  EOT
}

variable "cidrs" {
  description = "Subnet IP CIDR ranges."
  type        = map(string)
  default = {
    gce = "10.0.16.0/24"
  }
}

variable "network" {
  description = "Network name."
  type        = string
  default     = "reverse-proxy-vpc"
}

variable "network_create" {
  description = "Create network or use existing one."
  type        = bool
  default     = true
}

variable "nginx_image" {
  description = "Nginx container image to use."
  type        = string
  default     = "gcr.io/cloud-marketplace/google/nginx1:latest"
}

variable "ops_agent_image" {
  description = "Google Cloud Ops Agent container image to use."
  type        = string
  default     = "gcr.io/sfans-hub-project-d647/ops-agent:latest"
}

variable "prefix" {
  description = "Prefix used for resources that need unique names."
  type        = string
  default     = ""
}

variable "project_create" {
  description = "Parameters for the creation of the new project"
  type = object({
    billing_account_id = string
    parent             = string
  })
  default = null
}

variable "project_name" {
  description = "Name of an existing project or of the new project"
  type        = string
}

variable "region" {
  description = "Default region for resources."
  type        = string
  default     = "europe-west4"
}

variable "subnetwork" {
  description = "Subnetwork name."
  type        = string
  default     = "gce"
}

variable "tls" {
  description = "Also offer reverse proxying with TLS (self-signed certificate)."
  type        = bool
  default     = false
}

