# modules/vertex-ai-vector-search/outputs.tf
# -----------------------------------------------------------------------------
# Vector Search Core Outputs
# -----------------------------------------------------------------------------
output "index_id" {
  description = "The ID of the Vector Index"
  value       = local.index_id
}

output "endpoint_id" {
  description = "The ID of the created Vertex AI Index Endpoint"
  value       = google_vertex_ai_index_endpoint.vector_index_endpoint.id
}

output "deployed_index_id" {
  description = "The ID of the deployed index"
  value       = google_vertex_ai_index_endpoint_deployed_index.deployed_vector_index.deployed_index_id
}

# -----------------------------------------------------------------------------
# Endpoint Access Outputs
# -----------------------------------------------------------------------------
output "public_endpoint_domain_name" {
  description = "The public endpoint domain name (if enabled)"
  value       = local.is_public_endpoint ? google_vertex_ai_index_endpoint.vector_index_endpoint.public_endpoint_domain_name : null
}

# -----------------------------------------------------------------------------
# PSC-related outputs
# -----------------------------------------------------------------------------
output "service_attachment" {
  description = "The service attachment URI for PSC forwarding rule creation"
  value = try(
    local.is_psc_enabled || var.enable_vpc_peering ? google_vertex_ai_index_endpoint_deployed_index.deployed_vector_index.private_endpoints[0].service_attachment : null,
    null
  )
}

# Only output PSC address information when PSC is enabled
output "psc_address_ip" {
  description = "The IP address allocated for PSC"
  value       = var.enable_private_service_connect && length(google_compute_address.psc_address) > 0 ? google_compute_address.psc_address[0].address : null
}

output "match_grpc_address" {
  description = "The private gRPC address for sending match requests"
  value = try(
    local.is_psc_enabled || var.enable_vpc_peering ? google_vertex_ai_index_endpoint_deployed_index.deployed_vector_index.private_endpoints[0].match_grpc_address : null,
    null
  )
}

output "psc_automated_endpoints" {
  description = "PSC automated endpoints information (if PSC automation is used)"
  value = try(
    local.is_psc_enabled || var.enable_vpc_peering ? google_vertex_ai_index_endpoint_deployed_index.deployed_vector_index.private_endpoints[0].psc_automated_endpoints : null,
    null
  )
}

# New enhanced output with endpoint type
output "endpoint_access_info" {
  description = "Endpoint access information"
  value = {
    is_public      = local.is_public_endpoint
    is_psc_enabled = local.is_psc_enabled
    network        = var.endpoint_network
  }
}