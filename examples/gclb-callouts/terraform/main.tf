# Copyright 2025 Google LLC.
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
  project_id  = "gcp-project-id" // Update with your project ID.
  vpc_network = "default"
  vpc_project = "gcp-project-id" // Update with your project ID.
  zonal_neg_configs = [
    { "name" : "ext-demo-neg", "zone" : "us-central1-a" },
  ]
  ext_neg_name = "gke-ext-svc"
  lb_name      = "ext-demo"
  ext_neg_zone = "us-central1-a"
}

data "google_project" "project" {
  project_id = local.project_id
}

# External Global IP address for ext frontend
resource "google_compute_global_address" "ext-ip" {
  provider   = google-beta
  project    = local.project_id
  name       = "ext-demo-ip"
  ip_version = "IPV4"
}

# create lb
module "gce-lb-http" {
  source  = "GoogleCloudPlatform/lb-http/google"
  version = "12.0.0"

  project               = local.project_id
  name                  = local.lb_name
  load_balancing_scheme = "EXTERNAL_MANAGED"
  create_address        = false
  address               = google_compute_global_address.ext-ip.address
  firewall_networks     = [local.vpc_network]
  firewall_projects     = [local.vpc_project]
  create_url_map        = true
  backends = {
    default = {
      protocol    = "HTTP"
      timeout_sec = 60
      enable_cdn  = false
      health_check = {
        protocol           = "TCP"
        port_specification = "USE_FIXED_PORT"
        port               = "8080"
      }
      log_config = {
        enable      = true
        sample_rate = 1.0
      }
      groups = [
        for neg in local.zonal_neg_configs :
        {
          group                 = "projects/${local.project_id}/zones/${neg.zone}/networkEndpointGroups/${neg.name}"
          max_rate_per_endpoint = "10000"
          balancing_mode        = "RATE"
        }
      ]
      iap_config = {
        enable = false
      }
    }
  }
}

# health check probes allowed for service extension
resource "google_compute_firewall" "service-ext-fw" {
  name          = "service-ext-fw"
  project       = local.project_id
  direction     = "INGRESS"
  network       = local.vpc_network
  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]

  allow {
    protocol = "tcp"
    ports    = ["8000", "8443", "8181", "443"]
  }
}

# Health check for service extension backend
resource "google_compute_health_check" "service-ext-hc" {
  name    = "gclb-service-ext-hc"
  project = local.project_id

  timeout_sec        = 1
  check_interval_sec = 1

  tcp_health_check {
    port = "8000"
  }
}

# Backend service for Service extension NEG
resource "google_compute_backend_service" "service-ext-backend" {
  provider                        = google-beta
  project                         = local.project_id
  name                            = "service-ext-backend"
  load_balancing_scheme           = "EXTERNAL_MANAGED"
  enable_cdn                      = false
  timeout_sec                     = 30
  connection_draining_timeout_sec = 300
  health_checks                   = [google_compute_health_check.service-ext-hc.id]
  protocol                        = "HTTP2"

  backend {
    group                 = "projects/${local.project_id}/zones/${local.ext_neg_zone}/networkEndpointGroups/${local.ext_neg_name}"
    balancing_mode        = "RATE"
    max_rate_per_endpoint = "1000"
  }
}


# service extension
resource "google_network_services_lb_traffic_extension" "default" {
  name        = "l7-lb-traffic-ext"
  project     = local.project_id
  description = "GCLB traffic extension"
  location    = "global"

  load_balancing_scheme = "EXTERNAL_MANAGED"
  forwarding_rules      = ["https://www.googleapis.com/compute/v1/projects/${data.google_project.project.number}/global/forwardingRules/${local.lb_name}"]

  extension_chains {
    name = "chain1"

    match_condition {
      cel_expression = "request.host == 'example.com'"
    }

    extensions {
      name      = "ext11"
      authority = "ext11.com"
      service   = google_compute_backend_service.service-ext-backend.self_link
      timeout   = "0.1s"
      fail_open = false

      supported_events = ["REQUEST_HEADERS"]
      forward_headers  = ["secret"]
    }
  }
}