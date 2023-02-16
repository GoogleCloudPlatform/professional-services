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

variable "auto_create_network" {
  description = "Whether to create the default network for the project."
  type        = bool
  default     = false
}

variable "billing_account" {
  description = "Billing account id."
  type        = string
  default     = null
}

variable "contacts" {
  description = "List of essential contacts for this resource. Must be in the form EMAIL -> [NOTIFICATION_TYPES]. Valid notification types are ALL, SUSPENSION, SECURITY, TECHNICAL, BILLING, LEGAL, PRODUCT_UPDATES."
  type        = map(list(string))
  default     = {}
  nullable    = false
}

variable "custom_roles" {
  description = "Map of role name => list of permissions to create in this project."
  type        = map(list(string))
  default     = {}
  nullable    = false
}

variable "default_service_account" {
  description = "Project default service account setting: can be one of `delete`, `deprivilege`, `disable`, or `keep`."
  default     = "keep"
  type        = string
}

variable "descriptive_name" {
  description = "Name of the project name. Used for project name instead of `name` variable."
  type        = string
  default     = null
}

variable "group_iam" {
  description = "Authoritative IAM binding for organization groups, in {GROUP_EMAIL => [ROLES]} format. Group emails need to be static. Can be used in combination with the `iam` variable."
  type        = map(list(string))
  default     = {}
  nullable    = false
}

variable "iam" {
  description = "IAM bindings in {ROLE => [MEMBERS]} format."
  type        = map(list(string))
  default     = {}
  nullable    = false
}

variable "iam_additive" {
  description = "IAM additive bindings in {ROLE => [MEMBERS]} format."
  type        = map(list(string))
  default     = {}
  nullable    = false
}

variable "iam_additive_members" {
  description = "IAM additive bindings in {MEMBERS => [ROLE]} format. This might break if members are dynamic values."
  type        = map(list(string))
  default     = {}
}

variable "labels" {
  description = "Resource labels."
  type        = map(string)
  default     = {}
  nullable    = false
}

variable "lien_reason" {
  description = "If non-empty, creates a project lien with this description."
  type        = string
  default     = ""
}

variable "logging_exclusions" {
  description = "Logging exclusions for this project in the form {NAME -> FILTER}."
  type        = map(string)
  default     = {}
  nullable    = false
}

variable "logging_sinks" {
  description = "Logging sinks to create for this project."
  type = map(object({
    destination   = string
    type          = string
    filter        = string
    iam           = bool
    unique_writer = bool
    # TODO exclusions also support description and disabled
    exclusions = map(string)
  }))
  validation {
    condition = alltrue([
      for k, v in(var.logging_sinks == null ? {} : var.logging_sinks) :
      contains(["bigquery", "logging", "pubsub", "storage"], v.type)
    ])
    error_message = "Type must be one of 'bigquery', 'logging', 'pubsub', 'storage'."
  }
  default  = {}
  nullable = false
}

variable "metric_scopes" {
  description = "List of projects that will act as metric scopes for this project."
  type        = list(string)
  default     = []
  nullable    = false
}

variable "name" {
  description = "Project name and id suffix."
  type        = string
}

variable "org_policies" {
  description = "Organization policies applied to this project keyed by policy name."
  type = map(object({
    inherit_from_parent = optional(bool) # for list policies only.
    reset               = optional(bool)

    # default (unconditional) values
    allow = optional(object({
      all    = optional(bool)
      values = optional(list(string))
    }))
    deny = optional(object({
      all    = optional(bool)
      values = optional(list(string))
    }))
    enforce = optional(bool, true) # for boolean policies only.

    # conditional values
    rules = optional(list(object({
      allow = optional(object({
        all    = optional(bool)
        values = optional(list(string))
      }))
      deny = optional(object({
        all    = optional(bool)
        values = optional(list(string))
      }))
      enforce = optional(bool, true) # for boolean policies only.
      condition = object({
        description = optional(string)
        expression  = optional(string)
        location    = optional(string)
        title       = optional(string)
      })
    })), [])
  }))
  default  = {}
  nullable = false
}

variable "org_policies_data_path" {
  description = "Path containing org policies in YAML format."
  type        = string
  default     = null
}

variable "oslogin" {
  description = "Enable OS Login."
  type        = bool
  default     = false
}

variable "oslogin_admins" {
  description = "List of IAM-style identities that will be granted roles necessary for OS Login administrators."
  type        = list(string)
  default     = []
  nullable    = false

}

variable "oslogin_users" {
  description = "List of IAM-style identities that will be granted roles necessary for OS Login users."
  type        = list(string)
  default     = []
  nullable    = false
}

variable "parent" {
  description = "Parent folder or organization in 'folders/folder_id' or 'organizations/org_id' format."
  type        = string
  default     = null
  validation {
    condition     = var.parent == null || can(regex("(organizations|folders)/[0-9]+", var.parent))
    error_message = "Parent must be of the form folders/folder_id or organizations/organization_id."
  }
}

variable "prefix" {
  description = "Prefix used to generate project id and name."
  type        = string
  default     = null
}

variable "project_create" {
  description = "Create project. When set to false, uses a data source to reference existing project."
  type        = bool
  default     = true
}

variable "service_config" {
  description = "Configure service API activation."
  type = object({
    disable_on_destroy         = bool
    disable_dependent_services = bool
  })
  default = {
    disable_on_destroy         = false
    disable_dependent_services = false
  }
}

variable "service_encryption_key_ids" {
  description = "Cloud KMS encryption key in {SERVICE => [KEY_URL]} format."
  type        = map(list(string))
  default     = {}
}

# accessPolicies/ACCESS_POLICY_NAME/servicePerimeters/PERIMETER_NAME
variable "service_perimeter_bridges" {
  description = "Name of VPC-SC Bridge perimeters to add project into. See comment in the variables file for format."
  type        = list(string)
  default     = null
}

# accessPolicies/ACCESS_POLICY_NAME/servicePerimeters/PERIMETER_NAME
variable "service_perimeter_standard" {
  description = "Name of VPC-SC Standard perimeter to add project into. See comment in the variables file for format."
  type        = string
  default     = null
}

variable "services" {
  description = "Service APIs to enable."
  type        = list(string)
  default     = []
}

variable "shared_vpc_host_config" {
  description = "Configures this project as a Shared VPC host project (mutually exclusive with shared_vpc_service_project)."
  type = object({
    enabled          = bool
    service_projects = optional(list(string), [])
  })
  default = null
}

variable "shared_vpc_service_config" {
  description = "Configures this project as a Shared VPC service project (mutually exclusive with shared_vpc_host_config)."
  # the list of valid service identities is in service-accounts.tf
  type = object({
    host_project         = string
    service_identity_iam = optional(map(list(string)))
  })
  default = null
}

variable "skip_delete" {
  description = "Allows the underlying resources to be destroyed without destroying the project itself."
  type        = bool
  default     = false
}

variable "tag_bindings" {
  description = "Tag bindings for this project, in key => tag value id format."
  type        = map(string)
  default     = null
}
