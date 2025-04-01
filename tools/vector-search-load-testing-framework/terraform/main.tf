terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "6.18.1"
    }
  }
}

provider "google" {
  region = var.region
}

module "vector_search" {
  source = "./modules/vertex-ai-vector-search"

  # Project and region settings
  project_id           = var.project_id
  region               = var.region
  existing_bucket_name = var.existing_bucket_name

  # Index configuration
  vector_search_index_id            = var.vector_search_index_id
  embedding_data_path               = var.embedding_data_path
  index_display_name                = var.index_display_name
  index_description                 = var.index_description
  index_labels                      = var.index_labels
  index_dimensions                  = var.index_dimensions
  index_approximate_neighbors_count = var.index_approximate_neighbors_count
  index_distance_measure_type       = var.index_distance_measure_type
  index_shard_size                  = var.index_shard_size
  feature_norm_type                 = var.feature_norm_type
  index_algorithm_config_type       = var.index_algorithm_config_type

  # Index tree configuration
  index_tree_ah_leaf_node_embedding_count    = var.index_tree_ah_leaf_node_embedding_count
  index_tree_ah_leaf_nodes_to_search_percent = var.index_tree_ah_leaf_nodes_to_search_percent

  # Index management settings
  index_update_method  = var.index_update_method
  index_create_timeout = var.index_create_timeout
  index_update_timeout = var.index_update_timeout
  index_delete_timeout = var.index_delete_timeout

  # Endpoint configuration - use the derived locals from consolidated variables
  endpoint_display_name            = var.endpoint_display_name
  endpoint_description             = var.endpoint_description
  endpoint_labels                  = var.endpoint_labels
  endpoint_public_endpoint_enabled = local.endpoint_public_endpoint_enabled
  endpoint_network                 = local.endpoint_network
  subnetwork                       = var.network_configuration.subnetwork
  enable_private_service_connect   = local.endpoint_enable_private_service_connect
  # Add this parameter to pass VPC peering connection dependency
  enable_vpc_peering      = local.enable_vpc_peering
  peering_range_name      = var.peering_range_name
  peering_prefix_length   = var.peering_prefix_length
  endpoint_create_timeout = var.endpoint_create_timeout
  endpoint_update_timeout = var.endpoint_update_timeout
  endpoint_delete_timeout = var.endpoint_delete_timeout

  # Deployed index configuration
  deployed_index_id                     = var.deployed_index_id
  deployed_index_resource_type          = var.deployed_index_resource_type
  deployed_index_dedicated_machine_type = var.deployed_index_dedicated_machine_type
  deployed_index_dedicated_min_replicas = var.deployed_index_dedicated_min_replicas
  deployed_index_dedicated_max_replicas = var.deployed_index_dedicated_max_replicas
  deployed_index_automatic_min_replicas = var.deployed_index_automatic_min_replicas
  deployed_index_automatic_max_replicas = var.deployed_index_automatic_max_replicas
  deployed_index_reserved_ip_ranges     = var.deployed_index_reserved_ip_ranges
  deployed_index_create_timeout         = var.deployed_index_create_timeout
  deployed_index_update_timeout         = var.deployed_index_update_timeout
  deployed_index_delete_timeout         = var.deployed_index_delete_timeout
  deployment_id                         = var.deployment_id
}
module "gke_autopilot" {
  source              = "./modules/gke-autopilot"
  project_id          = var.project_id
  region              = var.region
  project_number      = var.project_number
  deployment_id       = var.deployment_id
  image               = var.image
  locust_test_type    = var.locust_test_type
  create_external_ip  = var.create_external_ip
  min_replicas_worker = var.min_replicas_worker

  # Use simplified network configuration from locals
  network                   = local.endpoint_network
  subnetwork                = local.subnetwork
  enable_private_networking = local.endpoint_enable_private_service_connect || local.enable_vpc_peering
  use_private_endpoint      = false
  master_ipv4_cidr_block    = local.master_ipv4_cidr_block
  gke_pod_subnet_range      = local.gke_pod_subnet_range
  gke_service_subnet_range  = local.gke_service_subnet_range
}

resource "google_compute_instance" "nginx_proxy" {
  count        = var.create_external_ip ? 0 : 1
  name         = "${lower(replace(var.deployment_id, "/[^a-z0-9\\-]+/", ""))}-ltf-nginx-proxy-${lower(replace(var.endpoint_access.type, "/[^a-z0-9\\-]+/", ""))}" # Add endpoint type to name
  machine_type = "e2-micro"
  zone         = "${var.region}-a"
  project      = var.project_id

  boot_disk {
    initialize_params {
      image = "cos-cloud/cos-stable"
    }
  }

  network_interface {
    # Use the consolidated network configuration
    network = local.endpoint_enable_private_service_connect || local.enable_vpc_peering ? (
      local.endpoint_network
    ) : "default"

    subnetwork = local.subnetwork != "" ? local.subnetwork : null

    # Only add public IP if not using private endpoints
    dynamic "access_config" {
      for_each = local.endpoint_enable_private_service_connect || local.enable_vpc_peering ? [] : [1]
      content {
        // Ephemeral public IP
      }
    }
  }

  metadata = {
    gce-container-declaration = <<EOT
spec:
  containers:
    - image: 'gcr.io/cloud-marketplace/google/nginx1:latest'
      name: nginx
      volumeMounts:
        - name: 'nginx-config'
          mountPath: '/etc/nginx/conf.d/default.conf'
          readOnly: true
  volumes:
    - name: 'nginx-config'
      hostPath:
        path: '/tmp/server.conf'
EOT

    startup-script = <<EOT
#!/bin/bash
cat <<EOFNGINX > /tmp/server.conf
server {
    listen 8089;
    location / {
        proxy_pass http://${module.gke_autopilot.locust_master_web_ip}:8089;
    }
}
EOFNGINX
EOT
  }

  # Network tag to apply firewall rule to allow SSH
  tags = ["${lower(replace(var.deployment_id, "/[^a-z0-9\\-]+/", ""))}-ltf-reverse-proxy-ssh"]

  service_account {
    scopes = ["cloud-platform"]
  }

  # Allow stopping for update
  allow_stopping_for_update = true

  depends_on = [module.gke_autopilot]
}

resource "google_compute_firewall" "allow_ssh_ingress" {
  count = (var.endpoint_access.type != "public" && !var.create_external_ip) ? 1 : 0
  name  = "${lower(replace(var.deployment_id, "/[^a-z0-9\\-]+/", ""))}-allow-ssh-to-reverse-proxy"
  network = local.endpoint_enable_private_service_connect ? (
    var.network_configuration.network_name
  ) : "default"
  project = var.project_id

  description = "Allow SSH"
  direction   = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  # Any IPv4 address
  source_ranges = ["0.0.0.0/0"]

  target_tags = ["${lower(replace(var.deployment_id, "/[^a-z0-9\\-]+/", ""))}-ltf-reverse-proxy-ssh"]
}
