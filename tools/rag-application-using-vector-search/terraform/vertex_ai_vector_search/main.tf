terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "6.18.1"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# -----------------------------------------------------------------------------
# Vertex AI Index Resource
# -----------------------------------------------------------------------------
resource "google_vertex_ai_index" "vector_index" {
  project      = var.project_id
  region       = var.region
  display_name = "${var.index_display_name}-${var.deployment_id}"
  description  = var.index_description
  labels       = var.index_labels


  metadata {
    config {
      dimensions                  = var.index_dimensions
      approximate_neighbors_count = var.index_approximate_neighbors_count
      distance_measure_type       = var.index_distance_measure_type
      shard_size                  = var.index_shard_size
      feature_norm_type           = var.feature_norm_type

      dynamic "algorithm_config" {
        for_each = var.index_algorithm_config_type == "tree_ah_config" ? [1] : []
        content {
          tree_ah_config {
            leaf_node_embedding_count    = var.index_tree_ah_leaf_node_embedding_count
            leaf_nodes_to_search_percent = var.index_tree_ah_leaf_nodes_to_search_percent
          }
        }
      }

      dynamic "algorithm_config" {
        for_each = var.index_algorithm_config_type == "brute_force_config" ? [1] : []
        content {
          brute_force_config {}
        }
      }
    }
  }
  index_update_method = "STREAM_UPDATE"

  timeouts {
    create = var.index_create_timeout
    update = var.index_update_timeout
    delete = var.index_delete_timeout
  }
}

# -----------------------------------------------------------------------------
# Vertex AI Index Endpoint Resource
# -----------------------------------------------------------------------------
resource "google_vertex_ai_index_endpoint" "vector_index_endpoint" {
  project      = var.project_id
  region       = var.region
  display_name = "${var.endpoint_display_name}-${var.deployment_id}"
  description  = var.endpoint_description
  labels       = var.endpoint_labels


  # Use different network settings based on access type
  public_endpoint_enabled = true

  timeouts {
    create = var.endpoint_create_timeout
    update = var.endpoint_update_timeout
    delete = var.endpoint_delete_timeout
  }
}

# -----------------------------------------------------------------------------
# Vertex AI Deployed Index Resource (Deploy Index to Endpoint)
# -----------------------------------------------------------------------------

resource "google_vertex_ai_index_endpoint_deployed_index" "deployed_vector_index" {
  depends_on     = [google_vertex_ai_index_endpoint.vector_index_endpoint, google_vertex_ai_index.vector_index]
  index_endpoint = google_vertex_ai_index_endpoint.vector_index_endpoint.id
  index          = google_vertex_ai_index.vector_index.id
  
  # Simplified deployed_index_id using standardized deployment_id
  deployed_index_id = "${var.deployed_index_id}_${var.deployment_id}"

  # Resource allocation based on type
  dynamic "dedicated_resources" {
    for_each = var.deployed_index_resource_type == "dedicated" ? [1] : []
    content {
      min_replica_count = var.deployed_index_dedicated_min_replicas
      max_replica_count = var.deployed_index_dedicated_max_replicas
      machine_spec {
        machine_type = var.deployed_index_dedicated_machine_type
      }
    }
  }

  dynamic "automatic_resources" {
    for_each = var.deployed_index_resource_type == "automatic" ? [1] : []
    content {
      min_replica_count = var.deployed_index_automatic_min_replicas
      max_replica_count = var.deployed_index_automatic_max_replicas
    }
  }

  timeouts {
    create = var.deployed_index_create_timeout
    update = var.deployed_index_update_timeout
    delete = var.deployed_index_delete_timeout
  }
}