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

# TODO(ludomagno): add a second variable and resource for custom access levels

# this code implements "additive" access levels, if "authoritative"
# access levels are needed, switch to the
# google_access_context_manager_access_levels resource

resource "google_access_context_manager_access_level" "basic" {
  for_each = var.access_levels == null ? {} : var.access_levels
  parent   = "accessPolicies/${local.access_policy}"
  name     = "accessPolicies/${local.access_policy}/accessLevels/${each.key}"
  title    = each.key
  basic {
    combining_function = each.value.combining_function
    dynamic "conditions" {
      for_each = toset(
        each.value.conditions == null ? [] : each.value.conditions
      )
      iterator = condition
      content {
        # uncomment here and in the variable type to enable
        # dynamic "device_policy" {
        #   for_each = toset(
        #     condition.key.device_policy == null ? [] : [condition.key.device_policy]
        #   )
        #   iterator = device_policy
        #   content {
        #     dynamic "os_constraints" {
        #       for_each = toset(
        #         device_policy.key.os_constraints == null ? [] : device_policy.key.os_constraints
        #       )
        #       iterator = os_constraint
        #       content {
        #         minimum_version            = os_constraint.key.minimum_version
        #         os_type                    = os_constraint.key.os_type
        #         require_verified_chrome_os = os_constraint.key.require_verified_chrome_os
        #       }
        #     }
        #     allowed_encryption_statuses      = device_policy.key.allowed_encryption_statuses
        #     allowed_device_management_levels = device_policy.key.allowed_device_management_levels
        #     require_admin_approval           = device_policy.key.require_admin_approval
        #     require_corp_owned               = device_policy.key.require_corp_owned
        #     require_screen_lock              = device_policy.key.require_screen_lock
        #   }
        # }
        ip_subnetworks = (
          condition.key.ip_subnetworks == null ? [] : condition.key.ip_subnetworks
        )
        members = (
          condition.key.members == null ? [] : condition.key.members
        )
        negate = condition.key.negate
        regions = (
          condition.key.regions == null ? [] : condition.key.regions
        )
        required_access_levels = (
          condition.key.required_access_levels == null
          ? []
          : condition.key.required_access_levels
        )
      }
    }
  }
}
