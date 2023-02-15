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

variable "automation" {
  # tfdoc:variable:source 00-bootstrap
  description = "Automation resources created by the bootstrap stage."
  type = object({
    outputs_bucket = string
  })
}

variable "billing_account" {
  # tfdoc:variable:source 00-bootstrap
  description = "Billing account id and organization id ('nnnnnnnn' or null)."
  type = object({
    id              = string
    organization_id = number
  })
}

variable "folder_ids" {
  # tfdoc:variable:source 01-resman
  description = "Folder name => id mappings, the 'security' folder name must exist."
  type = object({
    security = string
  })
}

variable "groups" {
  # tfdoc:variable:source 00-bootstrap
  description = "Group names to grant organization-level permissions."
  type        = map(string)
  # https://cloud.google.com/docs/enterprise/setup-checklist
  default = {
    gcp-billing-admins      = "gcp-billing-admins",
    gcp-devops              = "gcp-devops",
    gcp-network-admins      = "gcp-network-admins"
    gcp-organization-admins = "gcp-organization-admins"
    gcp-security-admins     = "gcp-security-admins"
    gcp-support             = "gcp-support"
  }
}

variable "kms_defaults" {
  description = "Defaults used for KMS keys."
  type = object({
    locations       = list(string)
    rotation_period = string
  })
  default = {
    locations       = ["europe", "europe-west1", "europe-west3", "global"]
    rotation_period = "7776000s"
  }
}

variable "kms_keys" {
  description = "KMS keys to create, keyed by name. Null attributes will be interpolated with defaults."
  type = map(object({
    iam             = map(list(string))
    labels          = map(string)
    locations       = list(string)
    rotation_period = string
  }))
  default = {}
}

variable "service_accounts" {
  # tfdoc:variable:source 01-resman
  description = "Automation service accounts that can assign the encrypt/decrypt roles on keys."
  type = object({
    data-platform-dev    = string
    data-platform-prod   = string
    project-factory-dev  = string
    project-factory-prod = string
  })
}

variable "organization" {
  # tfdoc:variable:source 00-bootstrap
  description = "Organization details."
  type = object({
    domain      = string
    id          = number
    customer_id = string
  })
}

variable "outputs_location" {
  description = "Path where providers, tfvars files, and lists for the following stages are written. Leave empty to disable."
  type        = string
  default     = null
}

variable "prefix" {
  # tfdoc:variable:source 00-bootstrap
  description = "Prefix used for resources that need unique names. Use 9 characters or less."
  type        = string

  validation {
    condition     = try(length(var.prefix), 0) < 10
    error_message = "Use a maximum of 9 characters for prefix."
  }
}

variable "vpc_sc_access_levels" {
  description = "VPC SC access level definitions."
  type = map(object({
    combining_function = string
    conditions = list(object({
      ip_subnetworks         = list(string)
      members                = list(string)
      negate                 = bool
      regions                = list(string)
      required_access_levels = list(string)
    }))
  }))
  default = {}
}

variable "vpc_sc_egress_policies" {
  description = "VPC SC egress policy defnitions."
  type = map(object({
    egress_from = object({
      identity_type = string
      identities    = list(string)
    })
    egress_to = object({
      operations = list(object({
        method_selectors = list(string)
        service_name     = string
      }))
      resources = list(string)
    })
  }))
  default = {}
}

variable "vpc_sc_ingress_policies" {
  description = "VPC SC ingress policy defnitions."
  type = map(object({
    ingress_from = object({
      identity_type        = string
      identities           = list(string)
      source_access_levels = list(string)
      source_resources     = list(string)
    })
    ingress_to = object({
      operations = list(object({
        method_selectors = list(string)
        service_name     = string
      }))
      resources = list(string)
    })
  }))
  default = {}
}

variable "vpc_sc_perimeter_access_levels" {
  description = "VPC SC perimeter access_levels."
  type = object({
    dev     = list(string)
    landing = list(string)
    prod    = list(string)
  })
  default = null
}

variable "vpc_sc_perimeter_egress_policies" {
  description = "VPC SC egress policies per perimeter, values reference keys defined in the `vpc_sc_ingress_policies` variable."
  type = object({
    dev     = list(string)
    landing = list(string)
    prod    = list(string)
  })
  default = null
}

variable "vpc_sc_perimeter_ingress_policies" {
  description = "VPC SC ingress policies per perimeter, values reference keys defined in the `vpc_sc_ingress_policies` variable."
  type = object({
    dev     = list(string)
    landing = list(string)
    prod    = list(string)
  })
  default = null
}

variable "vpc_sc_perimeter_projects" {
  description = "VPC SC perimeter resources."
  type = object({
    dev     = list(string)
    landing = list(string)
    prod    = list(string)
  })
  default = null
}
