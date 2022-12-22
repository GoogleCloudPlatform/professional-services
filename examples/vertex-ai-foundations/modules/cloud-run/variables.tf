
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

variable "audit_log_triggers" {
  description = "Event arc triggers (Audit log)."
  type = list(object({
    service_name = string
    method_name  = string
  }))
  default = null
}

variable "containers" {
  description = "Containers."
  type = list(object({
    image = string
    options = object({
      command = list(string)
      args    = list(string)
      env     = map(string)
      env_from = map(object({
        key  = string
        name = string
      }))
    })
    resources = object({
      limits = object({
        cpu    = string
        memory = string
      })
      requests = object({
        cpu    = string
        memory = string
      })
    })
    ports = list(object({
      name           = string
      protocol       = string
      container_port = string
    }))
    volume_mounts = map(string)
  }))
}

variable "iam" {
  description = "IAM bindings for Cloud Run service in {ROLE => [MEMBERS]} format."
  type        = map(list(string))
  default     = {}
}

variable "ingress_settings" {
  description = "Ingress settings."
  type        = string
  default     = null
}

variable "labels" {
  description = "Resource labels."
  type        = map(string)
  default     = {}
}

variable "name" {
  description = "Name used for cloud run service."
  type        = string
}

variable "prefix" {
  description = "Optional prefix used for resource names."
  type        = string
  default     = null
}

variable "project_id" {
  description = "Project id used for all resources."
  type        = string
}

variable "pubsub_triggers" {
  description = "Eventarc triggers (Pub/Sub)."
  type        = list(string)
  default     = null
}

variable "region" {
  description = "Region used for all resources."
  type        = string
  default     = "europe-west1"
}

variable "revision_annotations" {
  description = "Configure revision template annotations."
  type = object({
    autoscaling = object({
      max_scale = number
      min_scale = number
    })
    cloudsql_instances  = list(string)
    vpcaccess_connector = string
    vpcaccess_egress    = string
  })
  default = null
}

variable "revision_name" {
  description = "Revision name."
  type        = string
  default     = null
}

variable "service_account" {
  description = "Service account email. Unused if service account is auto-created."
  type        = string
  default     = null
}

variable "service_account_create" {
  description = "Auto-create service account."
  type        = bool
  default     = false
}

variable "traffic" {
  description = "Traffic."
  type        = map(number)
  default     = null
}

variable "volumes" {
  description = "Volumes."
  type = list(object({
    name        = string
    secret_name = string
    items = list(object({
      key  = string
      path = string
    }))
  }))
  default = null
}

variable "vpc_connector_create" {
  description = "Populate this to create a VPC connector. You can then refer to it in the template annotations."
  type = object({
    ip_cidr_range = string
    name          = string
    vpc_self_link = string
  })
  default = null
}
