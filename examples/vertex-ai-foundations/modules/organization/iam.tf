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

# tfdoc:file:description IAM bindings, roles and audit logging resources.

locals {
  _group_iam_roles = distinct(flatten(values(var.group_iam)))
  _group_iam = {
    for r in local._group_iam_roles : r => [
      for k, v in var.group_iam : "group:${k}" if try(index(v, r), null) != null
    ]
  }
  _iam_additive_pairs = flatten([
    for role, members in var.iam_additive : [
      for member in members : { role = role, member = member }
    ]
  ])
  _iam_additive_member_pairs = flatten([
    for member, roles in var.iam_additive_members : [
      for role in roles : { role = role, member = member }
    ]
  ])
  iam = {
    for role in distinct(concat(keys(var.iam), keys(local._group_iam))) :
    role => concat(
      try(var.iam[role], []),
      try(local._group_iam[role], [])
    )
  }
  iam_additive = {
    for pair in concat(local._iam_additive_pairs, local._iam_additive_member_pairs) :
    "${pair.role}-${pair.member}" => pair
  }
}

resource "google_organization_iam_custom_role" "roles" {
  for_each    = var.custom_roles
  org_id      = local.organization_id_numeric
  role_id     = each.key
  title       = "Custom role ${each.key}"
  description = "Terraform-managed."
  permissions = each.value
}

resource "google_organization_iam_binding" "authoritative" {
  for_each = local.iam
  org_id   = local.organization_id_numeric
  role     = each.key
  members  = each.value
}

resource "google_organization_iam_member" "additive" {
  for_each = (
    length(var.iam_additive) + length(var.iam_additive_members) > 0
    ? local.iam_additive
    : {}
  )
  org_id = local.organization_id_numeric
  role   = each.value.role
  member = each.value.member
}

resource "google_organization_iam_policy" "authoritative" {
  count       = var.iam_bindings_authoritative != null || var.iam_audit_config_authoritative != null ? 1 : 0
  org_id      = local.organization_id_numeric
  policy_data = data.google_iam_policy.authoritative.policy_data
}

data "google_iam_policy" "authoritative" {
  dynamic "binding" {
    for_each = var.iam_bindings_authoritative != null ? var.iam_bindings_authoritative : {}
    content {
      role    = binding.key
      members = binding.value
    }
  }

  dynamic "audit_config" {
    for_each = var.iam_audit_config_authoritative != null ? var.iam_audit_config_authoritative : {}
    content {
      service = audit_config.key
      dynamic "audit_log_configs" {
        for_each = audit_config.value
        iterator = config
        content {
          log_type         = config.key
          exempted_members = config.value
        }
      }
    }
  }
}

resource "google_organization_iam_audit_config" "config" {
  for_each = var.iam_audit_config
  org_id   = local.organization_id_numeric
  service  = each.key
  dynamic "audit_log_config" {
    for_each = each.value
    iterator = config
    content {
      log_type         = config.key
      exempted_members = config.value
    }
  }
}
