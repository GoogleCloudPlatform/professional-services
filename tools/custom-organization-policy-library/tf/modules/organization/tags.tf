/**
 * Copyright 2023 Google LLC
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
      for value, value_attrs in attrs.values : {
        description = value_attrs.description,
        key         = "${tag}/${value}"
        id          = try(value_attrs.id, null)
        name        = value
        roles       = keys(value_attrs.iam)
        tag         = tag
        tag_id      = attrs.id
        tag_network = try(attrs.network, null) != null
      }
    ]
  ])
  _tag_values_iam = flatten([
    for key, value_attrs in local.tag_values : [
      for role in value_attrs.roles : {
        id   = value_attrs.id
        key  = value_attrs.key
        name = value_attrs.name
        role = role
        tag  = value_attrs.tag
      }
    ]
  ])
  _tags_iam = flatten([
    for tag, attrs in local.tags : [
      for role in keys(attrs.iam) : {
        role   = role
        tag    = tag
        tag_id = attrs.id
      }
    ]
  ])
  tag_values = {
    for t in local._tag_values : t.key => t
  }
  tag_values_iam = {
    for t in local._tag_values_iam : "${t.key}:${t.role}" => t
  }
  tags = merge(var.tags, var.network_tags)
  tags_iam = {
    for t in local._tags_iam : "${t.tag}:${t.role}" => t
  }
}

# keys

resource "google_tags_tag_key" "default" {
  for_each = { for k, v in local.tags : k => v if v.id == null }
  parent   = var.organization_id
  purpose = (
    lookup(each.value, "network", null) == null ? null : "GCE_FIREWALL"
  )
  purpose_data = (
    lookup(each.value, "network", null) == null ? null : { network = each.value.network }
  )
  short_name  = each.key
  description = each.value.description
  depends_on = [
    google_organization_iam_binding.authoritative,
    google_organization_iam_binding.bindings,
    google_organization_iam_member.bindings
  ]
}

resource "google_tags_tag_key_iam_binding" "default" {
  for_each = local.tags_iam
  tag_key = (
    each.value.tag_id == null
    ? google_tags_tag_key.default[each.value.tag].id
    : each.value.tag_id
  )
  role = each.value.role
  members = coalesce(
    local.tags[each.value.tag]["iam"][each.value.role], []
  )
}

# values

resource "google_tags_tag_value" "default" {
  for_each = { for k, v in local.tag_values : k => v if v.id == null }
  parent = (
    each.value.tag_id == null
    ? google_tags_tag_key.default[each.value.tag].id
    : each.value.tag_id
  )
  short_name  = each.value.name
  description = each.value.description
}

resource "google_tags_tag_value_iam_binding" "default" {
  for_each = local.tag_values_iam
  tag_value = (
    each.value.id == null
    ? google_tags_tag_value.default[each.value.key].id
    : each.value.id
  )
  role = each.value.role
  members = coalesce(
    local.tags[each.value.tag]["values"][each.value.name]["iam"][each.value.role],
    []
  )
}

# bindings

resource "google_tags_tag_binding" "binding" {
  for_each  = var.tag_bindings
  parent    = "//cloudresourcemanager.googleapis.com/${var.organization_id}"
  tag_value = each.value
}
