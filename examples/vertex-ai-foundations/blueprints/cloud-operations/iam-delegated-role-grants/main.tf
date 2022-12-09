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
  # this whole section builds a set of delegated role grants IAM
  # conditions expressions with the following criteria:
  # - each hasOnly call has no more that 10 roles
  # - each condition has no more than 12 logical operators (i.e. max
  #   13 conditions per binding)

  delegated_quoted_roles = formatlist("'%s'", sort(var.delegated_role_grants))
  role_chunks = [
    for chunk in chunklist(local.delegated_quoted_roles, 10) :
    join(", ", chunk)
  ]
  condition_string = "api.getAttribute('iam.googleapis.com/modifiedGrantsByRole', []).hasOnly([%s])"
  conditions       = formatlist(local.condition_string, local.role_chunks)
  expressions = [
    for chunk in chunklist(local.conditions, 13) :
    join(" || ", chunk)
  ]

  delegated_binding_pairs = {
    for index, expression in local.expressions :
    "delegated_${index + 1}" => {
      expression = expression
      index      = index + 1
    }
  }

  direct_iam_pairs = {
    for pair in setproduct(var.project_administrators, var.direct_role_grants) :
    "direct:${pair.0}:${pair.1}" => zipmap(["member", "role"], pair)
  }
}

module "project" {
  source         = "../../../modules/project"
  name           = var.project_id
  project_create = var.project_create
}

# make direct grants non-authoritative since project administrators
# can (probably) grant these roles outside terraform
resource "google_project_iam_member" "direct" {
  for_each = local.direct_iam_pairs
  project  = var.project_id
  role     = each.value.role
  member   = each.value.member
}

resource "google_project_iam_binding" "iam_bindings" {
  for_each = local.delegated_binding_pairs
  project  = var.project_id
  role     = var.restricted_role_grant
  members  = var.project_administrators
  condition {
    title       = "delegated_role_grant_${each.value.index}"
    description = "Delegated role grants (${each.value.index}/${length(local.expressions)})."
    expression  = each.value.expression
  }
}
