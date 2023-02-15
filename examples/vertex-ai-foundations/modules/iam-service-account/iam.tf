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

# tfdoc:file:description IAM bindings.

locals {
  iam_billing_pairs = flatten([
    for entity, roles in var.iam_billing_roles : [
      for role in roles : [
        { entity = entity, role = role }
      ]
    ]
  ])
  iam_folder_pairs = flatten([
    for entity, roles in var.iam_folder_roles : [
      for role in roles : [
        { entity = entity, role = role }
      ]
    ]
  ])
  iam_organization_pairs = flatten([
    for entity, roles in var.iam_organization_roles : [
      for role in roles : [
        { entity = entity, role = role }
      ]
    ]
  ])
  iam_project_pairs = flatten([
    for entity, roles in var.iam_project_roles : [
      for role in roles : [
        { entity = entity, role = role }
      ]
    ]
  ])
  iam_sa_pairs = flatten([
    for entity, roles in var.iam_sa_roles : [
      for role in roles : [
        { entity = entity, role = role }
      ]
    ]
  ])
  iam_storage_pairs = flatten([
    for entity, roles in var.iam_storage_roles : [
      for role in roles : [
        { entity = entity, role = role }
      ]
    ]
  ])
}

resource "google_service_account_iam_binding" "roles" {
  for_each           = var.iam
  service_account_id = local.service_account.name
  role               = each.key
  members            = each.value
}

resource "google_billing_account_iam_member" "billing-roles" {
  for_each = {
    for pair in local.iam_billing_pairs :
    "${pair.entity}-${pair.role}" => pair
  }
  billing_account_id = each.value.entity
  role               = each.value.role
  member             = local.resource_iam_email
}

resource "google_folder_iam_member" "folder-roles" {
  for_each = {
    for pair in local.iam_folder_pairs :
    "${pair.entity}-${pair.role}" => pair
  }
  folder = each.value.entity
  role   = each.value.role
  member = local.resource_iam_email
}

resource "google_organization_iam_member" "organization-roles" {
  for_each = {
    for pair in local.iam_organization_pairs :
    "${pair.entity}-${pair.role}" => pair
  }
  org_id = each.value.entity
  role   = each.value.role
  member = local.resource_iam_email
}

resource "google_project_iam_member" "project-roles" {
  for_each = {
    for pair in local.iam_project_pairs :
    "${pair.entity}-${pair.role}" => pair
  }
  project = each.value.entity
  role    = each.value.role
  member  = local.resource_iam_email
}

resource "google_service_account_iam_member" "additive" {
  for_each = {
    for pair in local.iam_sa_pairs :
    "${pair.entity}-${pair.role}" => pair
  }
  service_account_id = each.value.entity
  role               = each.value.role
  member             = local.resource_iam_email
}

resource "google_storage_bucket_iam_member" "bucket-roles" {
  for_each = {
    for pair in local.iam_storage_pairs :
    "${pair.entity}-${pair.role}" => pair
  }
  bucket = each.value.entity
  role   = each.value.role
  member = local.resource_iam_email
}
