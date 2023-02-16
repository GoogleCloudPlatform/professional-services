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

variable "firewall_policies" {
  description = "Hierarchical firewall policies created in this folder."
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
  })))
  default  = {}
  nullable = false
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

variable "folder_create" {
  description = "Create folder. When set to false, uses id to reference an existing folder."
  type        = bool
  default     = true
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

variable "id" {
  description = "Folder ID in case you use folder_create=false."
  type        = string
  default     = null
}

variable "logging_exclusions" {
  description = "Logging exclusions for this folder in the form {NAME -> FILTER}."
  type        = map(string)
  default     = {}
  nullable    = false
}

variable "logging_sinks" {
  description = "Logging sinks to create for this folder."
  type = map(object({
    destination      = string
    type             = string
    filter           = string
    include_children = bool
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

variable "name" {
  description = "Folder name."
  type        = string
  default     = null
}

variable "org_policies" {
  description = "Organization policies applied to this folder keyed by policy name."
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

variable "parent" {
  description = "Parent in folders/folder_id or organizations/org_id format."
  type        = string
  default     = null
  validation {
    condition     = var.parent == null || can(regex("(organizations|folders)/[0-9]+", var.parent))
    error_message = "Parent must be of the form folders/folder_id or organizations/organization_id."
  }
}

variable "tag_bindings" {
  description = "Tag bindings for this folder, in key => tag value id format."
  type        = map(string)
  default     = null
}
