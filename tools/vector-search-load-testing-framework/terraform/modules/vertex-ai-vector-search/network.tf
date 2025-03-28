terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "6.18.1"
    }
  }
}


# Create PSC address only when using Private Service Connect
resource "google_compute_address" "psc_address" {
  count   = var.enable_private_service_connect ? 1 : 0
  name    = "${lower(replace(var.deployment_id, "/[^a-z0-9\\-]+/", ""))}-ltf-psc-address"
  region  = var.region
  project = var.project_id
  # Use subnetwork directly from network_configuration
  subnetwork   = var.subnetwork
  address_type = "INTERNAL"
  purpose      = "GCE_ENDPOINT"
  description  = "PSC address for Vector Search endpoint"
}

locals {
  # Extract the network name regardless of input format
  network_name = var.endpoint_network != null ? (
    # If it's in full URL format
    startswith(var.endpoint_network, "https://") ?
    regex(".*/networks/([^/]+)$", var.endpoint_network)[0] :
    # If it's in projects/xxx/global/networks/yyy format
    startswith(var.endpoint_network, "projects/") ?
    regex(".*/networks/([^/]+)$", var.endpoint_network)[0] :
    # Otherwise assume it's just the network name
    var.endpoint_network
  ) : ""

  # Normalize to the full URL format Google API returns
  normalized_network = var.endpoint_network != null ? (
    "https://www.googleapis.com/compute/v1/projects/${var.project_id}/global/networks/${local.network_name}"
  ) : null
}
# Create forwarding rule only when using Private Service Connect
resource "google_compute_forwarding_rule" "psc_forwarding_rule" {
  count                 = var.enable_private_service_connect ? 1 : 0
  name                  = "${lower(replace(var.deployment_id, "/[^a-z0-9\\-]+/", ""))}-ltf-psc-forwarding-rule"
  region                = var.region
  project               = var.project_id
  network               = local.normalized_network
  ip_address            = google_compute_address.psc_address[0].self_link
  target                = google_vertex_ai_index_endpoint_deployed_index.deployed_vector_index.private_endpoints[0].service_attachment
  load_balancing_scheme = ""
  depends_on            = [google_vertex_ai_index_endpoint_deployed_index.deployed_vector_index]
}

# Create peering range only when using VPC Peering
resource "google_compute_global_address" "vpc_peering_range" {
  count         = var.enable_vpc_peering ? 1 : 0
  name          = "${lower(replace(var.deployment_id, "/[^a-z0-9\\-]+/", ""))}-${var.peering_range_name}"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = var.peering_prefix_length
  network       = var.endpoint_network
  project       = var.project_id

  lifecycle {
    ignore_changes = [
      # Ignore changes to network format (project ID vs number)
      network,
      # Remove creation_timestamp as it causes a warning
      # creation_timestamp,  
      description,
      ip_version
    ]
  }
}

# Establish the VPC peering connection
resource "google_service_networking_connection" "vpc_peering_connection" {
  count                   = var.enable_vpc_peering ? 1 : 0
  network                 = var.endpoint_network
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.vpc_peering_range[0].name]

  # Workaround to allow `terraform destroy`, see https://github.com/hashicorp/terraform-provider-google/issues/18729
  deletion_policy = "ABANDON"
  depends_on = [
    google_compute_global_address.vpc_peering_range
  ]
}

resource "time_sleep" "wait_for_peering" {
  count = var.enable_vpc_peering ? 1 : 0
  depends_on = [google_service_networking_connection.vpc_peering_connection]
  create_duration = "120s"
}