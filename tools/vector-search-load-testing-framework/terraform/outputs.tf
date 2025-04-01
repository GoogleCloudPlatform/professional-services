# outputs.tf (Root module)
# -----------------------------------------------------------------------------
# Vector Search Service Outputs
# -----------------------------------------------------------------------------
output "vector_search_index_id" {
  description = "The ID of the Vector Search index"
  value       = module.vector_search.index_id
}

output "vector_search_endpoint_id" {
  description = "The ID of the Vector Search endpoint"
  value       = module.vector_search.endpoint_id
}

output "vector_search_deployed_index_id" {
  description = "The ID of the deployed Vector Search index"
  value       = module.vector_search.deployed_index_id
}

# -----------------------------------------------------------------------------
# Endpoint Access Outputs
# -----------------------------------------------------------------------------
output "vector_search_public_endpoint" {
  description = "The public endpoint domain name (if enabled)"
  value       = try(module.vector_search.public_endpoint_domain_name, null)
}

# -----------------------------------------------------------------------------
# PSC Connectivity Outputs
# -----------------------------------------------------------------------------
output "vector_search_service_attachment" {
  description = "The service attachment URI for PSC forwarding rule creation"
  value       = module.vector_search.service_attachment
}

output "vector_search_match_grpc_address" {
  description = "The private gRPC address for sending match requests"
  value       = module.vector_search.match_grpc_address
}

# Only output PSC address information when PSC is enabled
output "psc_address_ip" {
  description = "The IP address allocated for PSC"
  value       = module.vector_search.psc_address_ip
}

# output "psc_forwarding_rule" {
#   description = "The PSC forwarding rule details" 
#   value       = var.endpoint_access.type == "private_service_connect" ? {
#     name    = google_compute_forwarding_rule.psc_forwarding_rule[0].name
#     ip      = google_compute_address.psc_address[0].address
#     network = google_compute_forwarding_rule.psc_forwarding_rule[0].network
#   } : null
# }

# -----------------------------------------------------------------------------
# Access Instructions
# -----------------------------------------------------------------------------
# output "locust_ui_access_instructions" {
#   description = "Instructions for accessing the Locust UI"
#   value       = "Run: gcloud compute ssh ${google_compute_instance.nginx_proxy.name} --project ${var.project_id} --zone ${google_compute_instance.nginx_proxy.zone} -- -NL 8089:localhost:8089\nThen open http://localhost:8089 in your browser"
# }

# Combined output for scripting use cases
# output "vector_search_connection_info" {
#   description = "Complete connection information for Vector Search"
#   value = {
#     endpoint_access_type = var.endpoint_access.type
#     public_endpoint = module.vector_search.public_endpoint_domain_name
#     psc_enabled = module.vector_search.psc_enabled
#     psc_ip_address = var.endpoint_access.type == "private_service_connect" && length(google_compute_address.psc_address) > 0 ? google_compute_address.psc_address[0].address : null
#     match_grpc_address = module.vector_search.match_grpc_address
#     endpoint_id = module.vector_search.endpoint_id
#     deployed_index_id = module.vector_search.deployed_index_id
#     network_name = var.network_configuration.network_name
#   }
# }

output "locust_master_svc_name" {
  description = "The name of the Locust master service"
  value       = module.gke_autopilot.locust_master_svc_name
}

output "locust_master_node_name" {
  description = "The name of the Locust master node"
  value       = module.gke_autopilot.locust_master_node_name
}

output "nginx_proxy_name" {
  description = "The name of the Nginx Proxy"
  value       = var.create_external_ip ? null : google_compute_instance.nginx_proxy[0].name
}

output "gke_cluster_name" {
  description = "The name of the deployed GKE cluster"
  value       = module.gke_autopilot.gke_cluster_name
}

output "locust_namespace" {
  description = "The Kubernetes namespace where Locust resources are deployed"
  value       = module.gke_autopilot.locust_namespace
}

output "locust_external_ip" {
  description = "The external IP address for accessing the Locust UI (if enabled)"
  value       = var.create_external_ip ? module.gke_autopilot.locust_master_web_ip : null
}