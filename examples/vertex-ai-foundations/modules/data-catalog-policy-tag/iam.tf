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

# tfdoc:file:description Data Catalog Taxonomy IAM definition.

locals {
  _group_iam = {
    for r in local._group_iam_roles : r => [
      for k, v in var.group_iam : "group:${k}" if try(index(v, r), null) != null
    ]
  }
  _group_iam_roles = distinct(flatten(values(var.group_iam)))
  _iam_additive_member_pairs = flatten([
    for member, roles in var.iam_additive_members : [
      for role in roles : { role = role, member = member }
    ]
  ])
  _iam_additive_pairs = flatten([
    for role, members in var.iam_additive : [
      for member in members : { role = role, member = member }
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
  tags_iam = flatten([
    for tag, roles in var.tags : [
      for role, members in roles : {
        tag     = tag
        role    = role
        members = members
      }
    ] if roles != null
  ])
}

resource "google_data_catalog_taxonomy_iam_binding" "authoritative" {
  provider = google-beta
  for_each = local.iam
  role     = each.key
  members  = each.value
  taxonomy = google_data_catalog_taxonomy.default.id
}

resource "google_data_catalog_taxonomy_iam_member" "additive" {
  provider = google-beta
  for_each = (
    length(var.iam_additive) + length(var.iam_additive_members) > 0
    ? local.iam_additive
    : {}
  )
  role     = each.value.role
  member   = each.value.member
  taxonomy = google_data_catalog_taxonomy.default.id
}

resource "google_data_catalog_policy_tag_iam_binding" "authoritative" {
  provider = google-beta
  for_each = {
    for v in local.tags_iam : "${v.tag}.${v.role}" => v
  }

  policy_tag = google_data_catalog_policy_tag.default[each.value.tag].name
  role       = each.value.role
  members    = each.value.members
}
