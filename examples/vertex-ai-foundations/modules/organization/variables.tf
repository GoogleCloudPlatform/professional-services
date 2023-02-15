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

variable "firewall_policies" {
  description = "Hierarchical firewall policy rules created in the organization."
  type = map(map(object({
    action                  = string
    description             = string
    direction               = string
    logging                 = bool
    ports                   = map(list(string))
    priority                = number
    ranges                  = list(string)
    target_resources        = list(string)
    target_service_accounts = list(string)
    # preview                 = bool
  })))
  default = {}
}

variable "firewall_policy_association" {
  description = "The hierarchical firewall policy to associate to this folder. Must be either a key in the `firewall_policies` map or the id of a policy defined somewhere else."
  type        = map(string)
  default     = {}
  nullable    = false
}

variable "firewall_policy_factory" {
  description = "Configuration for the firewall policy factory."
  type = object({
    cidr_file   = string
    policy_name = string
    rules_file  = string
  })
  default = null
}

variable "group_iam" {
  description = "Authoritative IAM binding for organization groups, in {GROUP_EMAIL => [ROLES]} format. Group emails need to be static. Can be used in combination with the `iam` variable."
  type        = map(list(string))
  default     = {}
  nullable    = false
}

variable "iam" {
  description = "IAM bindings, in {ROLE => [MEMBERS]} format."
  type        = map(list(string))
  default     = {}
  nullable    = false
}

variable "iam_additive" {
  description = "Non authoritative IAM bindings, in {ROLE => [MEMBERS]} format."
  type        = map(list(string))
  default     = {}
  nullable    = false
}

variable "iam_additive_members" {
  description = "IAM additive bindings in {MEMBERS => [ROLE]} format. This might break if members are dynamic values."
  type        = map(list(string))
  default     = {}
  nullable    = false
}

variable "iam_audit_config" {
  description = "Service audit logging configuration. Service as key, map of log permission (eg DATA_READ) and excluded members as value for each service."
  type        = map(map(list(string)))
  default     = {}
  nullable    = false
  # default = {
  #   allServices = {
  #     DATA_READ = ["user:me@example.org"]
  #   }
  # }
}

variable "iam_audit_config_authoritative" {
  description = "IAM Authoritative service audit logging configuration. Service as key, map of log permission (eg DATA_READ) and excluded members as value for each service. Audit config should also be authoritative when using authoritative bindings. Use with caution."
  type        = map(map(list(string)))
  default     = null
  # default = {
  #   allServices = {
  #     DATA_READ = ["user:me@example.org"]
  #   }
  # }
}

variable "iam_bindings_authoritative" {
  description = "IAM authoritative bindings, in {ROLE => [MEMBERS]} format. Roles and members not explicitly listed will be cleared. Bindings should also be authoritative when using authoritative audit config. Use with caution."
  type        = map(list(string))
  default     = null
}

variable "logging_exclusions" {
  description = "Logging exclusions for this organization in the form {NAME -> FILTER}."
  type        = map(string)
  default     = {}
  nullable    = false
}

variable "logging_sinks" {
  description = "Logging sinks to create for this organization."
  type = map(object({
    destination          = string
    type                 = string
    filter               = string
    include_children     = bool
    bq_partitioned_table = bool
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

variable "org_policies" {
  description = "Organization policies applied to this organization keyed by policy name."
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

variable "organization_id" {
  description = "Organization id in organizations/nnnnnn format."
  type        = string
  validation {
    condition     = can(regex("^organizations/[0-9]+", var.organization_id))
    error_message = "The organization_id must in the form organizations/nnn."
  }
}

variable "org_policies_data_path" {
  description = "Path containing org policies in YAML format."
  type        = string
  default     = null
}

variable "tag_bindings" {
  description = "Tag bindings for this organization, in key => tag value id format."
  type        = map(string)
  default     = null
}

variable "tags" {
  description = "Tags by key name. The `iam` attribute behaves like the similarly named one at module level."
  type = map(object({
    description = string
    iam         = map(list(string))
    values = map(object({
      description = string
      iam         = map(list(string))
    }))
  }))
  default = null
}
