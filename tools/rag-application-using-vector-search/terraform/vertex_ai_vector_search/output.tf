# -----------------------------------------------------------------------------
# Vector Search Core Outputs
# -----------------------------------------------------------------------------
output "index_id" {
  description = "The ID of the Vector Index"
  value       = google_vertex_ai_index.vector_index.id
}

output "endpoint_id" {
  description = "The ID of the created Vertex AI Index Endpoint"
  value       = google_vertex_ai_index_endpoint.vector_index_endpoint.id
}

output "deployed_index_id" {
  description = "The ID of the deployed index"
  value       = google_vertex_ai_index_endpoint_deployed_index.deployed_vector_index.deployed_index_id
}