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

# Feature Store Outputs
output "feature_store_id" {
  description = "The full resource name of the feature store"
  value       = google_vertex_ai_feature_online_store.feature_store.id
}

output "feature_store_state" {
  description = "The current state of the feature store"
  value       = google_vertex_ai_feature_online_store.feature_store.state
}

output "storage_type" {
  description = "The type of storage being used (optimized or bigtable)"
  value       = var.storage_type
}

# BigTable-specific outputs
output "bigtable_config" {
  description = "BigTable configuration details (only populated when storage_type is 'bigtable')"
  value = var.storage_type == "bigtable" ? {
    min_node_count         = var.bigtable_min_node_count
    max_node_count         = var.bigtable_max_node_count
    cpu_utilization_target = var.bigtable_cpu_utilization_target
  } : null
}

output "public_endpoint_domain_name" {
  description = "The domain name of the public endpoint"
  value       = try(google_vertex_ai_feature_online_store.feature_store.dedicated_serving_endpoint[0].public_endpoint_domain_name, null)
}

# Feature View Outputs
output "feature_view_id" {
  description = "The full resource name of the feature view"
  value       = google_vertex_ai_feature_online_store_featureview.featureview_vector_search.id
}

output "feature_view_create_time" {
  description = "The creation time of the feature view"
  value       = google_vertex_ai_feature_online_store_featureview.featureview_vector_search.create_time
}

output "sync_schedule" {
  description = "The configured sync schedule"
  value       = var.sync_schedule
}

output "entity_id_columns" {
  description = "The configured entity ID columns"
  value       = var.entity_id_columns
}

output "embedding_config" {
  description = "Vector search configuration details (only populated when embedding_column is provided)"
  value = var.embedding_column != null ? {
    embedding_column = var.embedding_column
    dimension        = var.embedding_dimension
    distance_measure = var.distance_measure_type
    filter_columns   = var.filter_columns
    crowding_column  = var.crowding_column
  } : null
}