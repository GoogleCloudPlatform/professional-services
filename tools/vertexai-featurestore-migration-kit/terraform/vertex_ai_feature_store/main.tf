# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Configure the Google Cloud provider
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "vertex_ai_api" {
  service            = "aiplatform.googleapis.com"
  disable_on_destroy = false
}

# Create the optimized/bigtable feature store
resource "google_vertex_ai_feature_online_store" "feature_store" {
  name   = var.feature_store_name
  region = var.region

  # Dynamic block for optimized storage
  dynamic "optimized" {
    for_each = var.storage_type == "optimized" ? [1] : []
    content {
    }
  }

  # Dynamic block for bigtable storage
  dynamic "bigtable" {
    for_each = var.storage_type == "bigtable" ? [1] : []
    content {
      auto_scaling {
        min_node_count         = var.bigtable_min_node_count
        max_node_count         = var.bigtable_max_node_count
        cpu_utilization_target = var.bigtable_cpu_utilization_target
      }
    }
  }
  # Configure labels for organization
  labels = {
    environment = "production"
    managed_by  = "terraform"
  }

  # Configure dedicated serving endpoint with public access
  dynamic "dedicated_serving_endpoint" {
    for_each = var.enable_dedicated_serving_endpoint ? [1] : []
    content {
      dynamic "private_service_connect_config" {
        for_each = var.enable_private_service_connect ? [1] : []
        content {
          enable_private_service_connect = true
          project_allowlist              = var.project_allowlist
        }
      }
    }
  }

  # Enable force destroy for cleanup
  force_destroy = true

  timeouts {
    create = "20m"
    update = "20m"
    delete = "20m"
  }

  # Add lifecycle block to force new resource on changes
  lifecycle {
    create_before_destroy = true
  }


  depends_on = [google_project_service.vertex_ai_api]
}


# # Create the feature view with vector search configuration
resource "google_vertex_ai_feature_online_store_featureview" "featureview_vector_search" {
  provider             = google-beta
  name                 = var.feature_view_id
  region               = var.region
  feature_online_store = google_vertex_ai_feature_online_store.feature_store.name

  # Configure sync schedule using variable
  sync_config {
    cron = var.sync_schedule
  }

  # Configure BigQuery source using existing table
  big_query_source {
    uri               = "bq://${var.project_id}.${var.bigquery_dataset_id}.${var.bigquery_table_id}"
    entity_id_columns = var.entity_id_columns

  }

  # Configure vector search
  dynamic "vector_search_config" {
    for_each = var.embedding_column != null ? [1] : []
    content {
      embedding_column      = var.embedding_column
      embedding_dimension   = tostring(var.embedding_dimension)
      distance_measure_type = var.distance_measure_type
      filter_columns        = var.filter_columns
      crowding_column       = var.crowding_column

      tree_ah_config {
        leaf_node_embedding_count = "10000"
      }
    }
  }

  timeouts {
    create = "20m"
    update = "20m"
    delete = "20m"
  }

  depends_on = [
    google_vertex_ai_feature_online_store.feature_store
  ]
}