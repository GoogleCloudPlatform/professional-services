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

variable "access_levels" {
  description = "Map of access levels in name => [conditions] format."
  type = map(object({
    combining_function = string
    conditions = list(object({
      # disabled to reduce var surface, uncomment here and in resource to enable
      # device_policy = object({
      #   require_screen_lock              = bool
      #   allowed_encryption_statuses      = list(string)
      #   allowed_device_management_levels = list(string)
      #   os_constraints = list(object({
      #     minimum_version            = string
      #     os_type                    = string
      #     require_verified_chrome_os = bool
      #   }))
      #   require_admin_approval = bool
      #   require_corp_owned     = bool
      # })
      ip_subnetworks         = list(string)
      members                = list(string)
      negate                 = bool
      regions                = list(string)
      required_access_levels = list(string)
    }))
  }))
  default = {}
  validation {
    condition = alltrue([
      for k, v in var.access_levels : (
        v.combining_function == null ||
        v.combining_function == "AND" ||
        v.combining_function == "OR"
      )
    ])
    error_message = "Invalid `combining_function` value (null, \"AND\", \"OR\" accepted)."
  }
}

variable "access_policy" {
  description = "Access Policy name, leave null to use auto-created one."
  type        = string
}

variable "access_policy_create" {
  description = "Access Policy configuration, fill in to create. Parent is in 'organizations/123456' format."
  type = object({
    parent = string
    title  = string
  })
  default = null
}

variable "service_perimeters_bridge" {
  description = "Bridge service perimeters."
  type = map(object({
    spec_resources            = list(string)
    status_resources          = list(string)
    use_explicit_dry_run_spec = bool
  }))
  default = {}
}

variable "service_perimeters_regular" {
  description = "Regular service perimeters."
  type = map(object({
    spec = object({
      access_levels       = list(string)
      resources           = list(string)
      restricted_services = list(string)
      egress_policies = list(object({
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
      ingress_policies = list(object({
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
      vpc_accessible_services = object({
        allowed_services   = list(string)
        enable_restriction = bool
      })
    })
    status = object({
      access_levels       = list(string)
      resources           = list(string)
      restricted_services = list(string)
      egress_policies = list(object({
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
      ingress_policies = list(object({
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
      vpc_accessible_services = object({
        allowed_services   = list(string)
        enable_restriction = bool
      })
    })
    use_explicit_dry_run_spec = bool
  }))
  default = {}
}
