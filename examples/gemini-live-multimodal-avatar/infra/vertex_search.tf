# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

locals {
  final_bucket_name = var.data_bucket_name != "" ? var.data_bucket_name : "${var.project_id}-${local.full_service_name}-data"
}

resource "random_id" "ds_suffix" {
  byte_length = 4
}

resource "google_discovery_engine_data_store" "vertex_ds" {
  project                     = var.project_id
  location                    = var.vertex_search_location
  data_store_id               = "${local.full_service_name}-ds-${random_id.ds_suffix.hex}"
  display_name                = "Vertex Search Data Store"
  industry_vertical           = "GENERIC"
  content_config              = "CONTENT_REQUIRED"
  solution_types              = ["SOLUTION_TYPE_SEARCH"]
  create_advanced_site_search = false

  depends_on = [google_project_service.apis]

  lifecycle {
    ignore_changes = [
      document_processing_config
    ]
  }
}

resource "google_discovery_engine_search_engine" "vertex_search" {
  project        = var.project_id
  engine_id      = "${local.full_service_name}-search-${random_id.ds_suffix.hex}"
  collection_id  = "default_collection"
  location       = google_discovery_engine_data_store.vertex_ds.location
  display_name   = "Vertex Search Application"
  data_store_ids = [google_discovery_engine_data_store.vertex_ds.data_store_id]

  search_engine_config {
  }

  depends_on = [google_discovery_engine_data_store.vertex_ds]
}

resource "google_storage_bucket" "data_bucket" {
  project                     = var.project_id
  name                        = local.final_bucket_name
  location                    = var.region
  force_destroy               = true
  uniform_bucket_level_access = true
}
