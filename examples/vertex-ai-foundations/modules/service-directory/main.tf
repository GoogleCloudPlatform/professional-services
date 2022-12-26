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
  endpoint_list = flatten([
    for name, attrs in var.services : [
      for endpoint in attrs.endpoints : { service : name, endpoint : endpoint }
    ]
  ])
  endpoints = {
    for ep in local.endpoint_list : "${ep.service}/${ep.endpoint}" => ep
  }
  iam_pairs = var.service_iam == null ? [] : flatten([
    for name, bindings in var.service_iam :
    [for role in keys(bindings) : { name = name, role = role }]
  ])
  iam_keypairs = {
    for pair in local.iam_pairs :
    "${pair.name}-${pair.role}" => pair
  }
}

resource "google_service_directory_namespace" "default" {
  provider     = google-beta
  project      = var.project_id
  namespace_id = var.name
  location     = var.location
  labels       = var.labels
}

resource "google_service_directory_namespace_iam_binding" "default" {
  provider = google-beta
  for_each = var.iam
  name     = google_service_directory_namespace.default.name
  role     = each.key
  members  = each.value
}

resource "google_service_directory_service" "default" {
  provider   = google-beta
  for_each   = var.services
  namespace  = google_service_directory_namespace.default.id
  service_id = each.key
  metadata   = each.value.metadata
}

resource "google_service_directory_service_iam_binding" "default" {
  provider = google-beta
  for_each = local.iam_keypairs
  name     = google_service_directory_service.default[each.value.name].name
  role     = each.value.role
  members = lookup(
    lookup(var.service_iam, each.value.name, {}), each.value.role, []
  )
}

resource "google_service_directory_endpoint" "default" {
  provider    = google-beta
  for_each    = local.endpoints
  endpoint_id = each.value.endpoint
  service     = google_service_directory_service.default[each.value.service].id
  metadata    = try(var.endpoint_config[each.key].metadata, null)
  address     = try(var.endpoint_config[each.key].address, null)
  port        = try(var.endpoint_config[each.key].port, null)
}
