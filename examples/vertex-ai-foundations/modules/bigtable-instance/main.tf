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
  tables = {
    for k, v in var.tables : k => v != null ? v : var.table_options_defaults
  }
}

resource "google_bigtable_instance" "default" {
  project = var.project_id
  name    = var.name
  cluster {
    cluster_id   = var.cluster_id
    zone         = var.zone
    storage_type = var.storage_type
  }
  instance_type = var.instance_type

  display_name        = var.display_name == null ? var.display_name : var.name
  deletion_protection = var.deletion_protection
}

resource "google_bigtable_instance_iam_binding" "default" {
  for_each = var.iam
  project  = var.project_id
  instance = google_bigtable_instance.default.name
  role     = each.key
  members  = each.value
}

resource "google_bigtable_table" "default" {
  for_each      = local.tables
  project       = var.project_id
  instance_name = google_bigtable_instance.default.name
  name          = each.key
  split_keys    = each.value.split_keys

  dynamic "column_family" {
    for_each = each.value.column_family != null ? [""] : []

    content {
      family = each.value.column_family
    }
  }

  # lifecycle {
  #   prevent_destroy = true
  # }
}
