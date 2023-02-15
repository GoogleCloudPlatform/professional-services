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

# tfdoc:file:description Data Catalog Taxonomy definition

locals {
  name = (
    var.name != null ? var.name : "${local.prefix}taxonomy"
  )
  prefix = var.prefix == null ? "" : "${var.prefix}-"
}

resource "google_data_catalog_taxonomy" "default" {
  provider               = google-beta
  project                = var.project_id
  region                 = var.location
  display_name           = local.name
  description            = var.description
  activated_policy_types = var.activated_policy_types
}

resource "google_data_catalog_policy_tag" "default" {
  for_each     = toset(keys(var.tags))
  provider     = google-beta
  taxonomy     = google_data_catalog_taxonomy.default.id
  display_name = each.key
  description  = "${each.key} - Terraform managed.  "
}
