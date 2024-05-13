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
  _custom_constraints_factory_data_raw = merge([
    for f in try(fileset(var.factories_config.org_policy_custom_constraints, "*.yaml"), []) :
    yamldecode(file("${var.factories_config.org_policy_custom_constraints}/${f}"))
  ]...)
  _custom_constraints_factory_data = {
    for k, v in local._custom_constraints_factory_data_raw :
    k => {
      display_name   = try(v.display_name, null)
      description    = try(v.description, null)
      action_type    = v.action_type
      condition      = v.condition
      method_types   = v.method_types
      resource_types = v.resource_types
    }
  }
  _custom_constraints = merge(
    local._custom_constraints_factory_data,
    var.org_policy_custom_constraints
  )
  custom_constraints = {
    for k, v in local._custom_constraints :
    k => merge(v, {
      name   = k
      parent = var.organization_id
    })
  }
}

resource "google_org_policy_custom_constraint" "constraint" {
  provider = google-beta

  for_each       = local.custom_constraints
  name           = each.value.name
  parent         = each.value.parent
  display_name   = each.value.display_name
  description    = each.value.description
  action_type    = each.value.action_type
  condition      = each.value.condition
  method_types   = each.value.method_types
  resource_types = each.value.resource_types
}
