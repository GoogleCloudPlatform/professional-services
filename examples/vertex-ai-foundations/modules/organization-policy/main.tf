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


locals {
  policy_files = var.config_directory == null ? [] : concat(
    [
      for config_file in fileset("${path.root}/${var.config_directory}", "**/*.yaml") :
      "${path.root}/${var.config_directory}/${config_file}"
    ]
  )

  policies_raw = merge(
    merge(
      [
        for config_file in local.policy_files :
        try(yamldecode(file(config_file)), {})
      ]...
  ), var.policies)

  policies_list = flatten([
    for parent, policies in local.policies_raw : [
      for policy_name, policy in policies : {
        parent              = parent,
        policy_name         = policy_name,
        inherit_from_parent = try(policy["inherit_from_parent"], null),
        reset               = try(policy["reset"], null),
        rules = [
          for rule in try(policy["rules"], []) : {
            allow_all = try(length(rule["allow"]), -1) == 0 ? "TRUE" : null
            deny_all  = try(length(rule["deny"]), -1) == 0 ? "TRUE" : null
            enforce = try(rule["enforce"], null) == true ? "TRUE" : try(
            rule["enforce"], null) == false ? "FALSE" : null,
            condition = try(rule["condition"], null) != null ? {
              description = try(rule["condition"]["description"], null),
              expression  = try(rule["condition"]["expression"], null),
              location    = try(rule["condition"]["location"], null),
              title       = try(rule["condition"]["title"], null)
            } : null,
            values = try(length(rule["allow"]), 0) > 0 || try(length(rule["deny"]), 0) > 0 ? {
              allowed_values = try(length(rule["allow"]), 0) > 0 ? rule["allow"] : null
              denied_values  = try(length(rule["deny"]), 0) > 0 ? rule["deny"] : null
            } : null
          }
        ]
      }
    ]
  ])

  policies_map = {
    for item in local.policies_list :
    format("%s-%s", item["parent"], item["policy_name"]) => item
  }
}

resource "google_org_policy_policy" "primary" {
  for_each = local.policies_map
  name     = format("%s/policies/%s", each.value.parent, each.value.policy_name)
  parent   = each.value.parent

  spec {
    inherit_from_parent = each.value.inherit_from_parent
    reset               = each.value.reset
    dynamic "rules" {
      for_each = each.value.rules
      content {
        allow_all = rules.value.allow_all
        deny_all  = rules.value.deny_all
        enforce   = rules.value.enforce
        dynamic "condition" {
          for_each = rules.value.condition != null ? [""] : []
          content {
            description = rules.value.condition.description
            expression  = rules.value.condition.expression
            location    = rules.value.condition.location
            title       = rules.value.condition.title
          }
        }
        dynamic "values" {
          for_each = rules.value.values != null ? [""] : []
          content {
            allowed_values = rules.value.values.allowed_values
            denied_values  = rules.value.values.denied_values
          }
        }
      }
    }
  }
}
