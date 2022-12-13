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

# tfdoc:file:description Generic and OSLogin-specific IAM bindings and roles.

# IAM notes:
# - external users need to have accepted the invitation email to join
# - oslogin roles also require role to list instances
# - additive (non-authoritative) roles might fail due to dynamic values

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

resource "google_project_iam_custom_role" "roles" {
  for_each    = var.custom_roles
  project     = local.project.project_id
  role_id     = each.key
  title       = "Custom role ${each.key}"
  description = "Terraform-managed."
  permissions = each.value
}

resource "google_project_iam_binding" "authoritative" {
  for_each = local.iam
  project  = local.project.project_id
  role     = each.key
  members  = each.value
  depends_on = [
    google_project_service.project_services,
    google_project_iam_custom_role.roles
  ]
}

resource "google_project_iam_member" "additive" {
  for_each = (
    length(var.iam_additive) + length(var.iam_additive_members) > 0
    ? local.iam_additive
    : {}
  )
  project = local.project.project_id
  role    = each.value.role
  member  = each.value.member
  depends_on = [
    google_project_service.project_services,
    google_project_iam_custom_role.roles
  ]
}

resource "google_project_iam_member" "oslogin_iam_serviceaccountuser" {
  for_each = var.oslogin ? toset(distinct(concat(var.oslogin_admins, var.oslogin_users))) : toset([])
  project  = local.project.project_id
  role     = "roles/iam.serviceAccountUser"
  member   = each.value
}

resource "google_project_iam_member" "oslogin_compute_viewer" {
  for_each = var.oslogin ? toset(distinct(concat(var.oslogin_admins, var.oslogin_users))) : toset([])
  project  = local.project.project_id
  role     = "roles/compute.viewer"
  member   = each.value
}

resource "google_project_iam_member" "oslogin_admins" {
  for_each = var.oslogin ? toset(var.oslogin_admins) : toset([])
  project  = local.project.project_id
  role     = "roles/compute.osAdminLogin"
  member   = each.value
}

resource "google_project_iam_member" "oslogin_users" {
  for_each = var.oslogin ? toset(var.oslogin_users) : toset([])
  project  = local.project.project_id
  role     = "roles/compute.osLogin"
  member   = each.value
}
