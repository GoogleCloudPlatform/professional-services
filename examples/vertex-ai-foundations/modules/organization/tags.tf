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
  _tag_values = flatten([
    for tag, attrs in local.tags : [
      for value, value_attrs in coalesce(attrs.values, {}) : {
        description = coalesce(
          value_attrs == null ? null : value_attrs.description,
          "Managed by the Terraform organization module."
        )
        key  = "${tag}/${value}"
        name = value
        roles = keys(coalesce(
          value_attrs == null ? null : value_attrs.iam, {}
        ))
        tag = tag
      }
    ]
  ])
  _tag_values_iam = flatten([
    for key, value_attrs in local.tag_values : [
      for role in value_attrs.roles : {
        key  = value_attrs.key
        name = value_attrs.name
        role = role
        tag  = value_attrs.tag
      }
    ]
  ])
  _tags_iam = flatten([
    for tag, attrs in local.tags : [
      for role in keys(coalesce(attrs.iam, {})) : {
        role = role
        tag  = tag
      }
    ]
  ])
  tag_values = {
    for t in local._tag_values : t.key => t
  }
  tag_values_iam = {
    for t in local._tag_values_iam : "${t.key}:${t.role}" => t
  }
  tags = {
    for k, v in coalesce(var.tags, {}) :
    k => v == null ? { description = null, iam = {}, values = null } : v
  }
  tags_iam = {
    for t in local._tags_iam : "${t.tag}:${t.role}" => t
  }
}

# keys

resource "google_tags_tag_key" "default" {
  for_each   = local.tags
  parent     = var.organization_id
  short_name = each.key
  description = coalesce(
    each.value.description,
    "Managed by the Terraform organization module."
  )
  depends_on = [
    google_organization_iam_binding.authoritative,
    google_organization_iam_member.additive,
    google_organization_iam_policy.authoritative,
  ]
}

resource "google_tags_tag_key_iam_binding" "default" {
  for_each = local.tags_iam
  tag_key  = google_tags_tag_key.default[each.value.tag].id
  role     = each.value.role
  members = coalesce(
    local.tags[each.value.tag]["iam"][each.value.role], []
  )
}

# values

resource "google_tags_tag_value" "default" {
  for_each   = local.tag_values
  parent     = google_tags_tag_key.default[each.value.tag].id
  short_name = each.value.name
  description = coalesce(
    each.value.description,
    "Managed by the Terraform organization module."
  )
}

resource "google_tags_tag_value_iam_binding" "default" {
  for_each  = local.tag_values_iam
  tag_value = google_tags_tag_value.default[each.value.key].id
  role      = each.value.role
  members = coalesce(
    local.tags[each.value.tag]["values"][each.value.name]["iam"][each.value.role],
    []
  )
}

# bindings

resource "google_tags_tag_binding" "binding" {
  for_each  = coalesce(var.tag_bindings, {})
  parent    = "//cloudresourcemanager.googleapis.com/${var.organization_id}"
  tag_value = each.value
}
