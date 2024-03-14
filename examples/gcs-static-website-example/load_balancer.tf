#    Copyright 2023 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

locals {
  health_check = {
    check_interval_sec  = 15
    timeout_sec         = null
    healthy_threshold   = null
    unhealthy_threshold = null
    request_path        = "/"
    port                = 80
    host                = null
    logging             = null
  }
}

# Create a classic load balancer with https redirect
module "gce-lb-https" {
  source  = "GoogleCloudPlatform/lb-http/google"
  version = "~> 9.0"
  name    = google_compute_network.default.name
  project = data.google_project.project.project_id
  firewall_networks = [google_compute_network.default.self_link]
  url_map           = google_compute_url_map.ml-bkd-ml-mig-bckt-s-lb.self_link
  create_url_map    = false
  ssl               = true
  https_redirect = true
  managed_ssl_certificate_domains = [var.domain]

  backends = {
    api = {
      description                     = null
      protocol                        = "HTTP"
      port                            = 80
      port_name                       = "http"
      timeout_sec                     = 10
      connection_draining_timeout_sec = null
      enable_cdn                      = false
      edge_security_policy            = null
      security_policy                 = null
      session_affinity                = null
      affinity_cookie_ttl_sec         = null
      custom_request_headers          = null
      custom_response_headers         = null
      compression_mode                = null

      health_check = local.health_check
      log_config = {
        enable      = true
        sample_rate = 1.0
      }

      groups = [
        {
          group                        = module.webserver.instance_group # google_compute_instance_group.webserver.self_link
          balancing_mode               = null
          capacity_scaler              = null
          description                  = null
          max_connections              = null
          max_connections_per_instance = null
          max_connections_per_endpoint = null
          max_rate                     = null
          max_rate_per_instance        = null
          max_rate_per_endpoint        = null
          max_utilization              = null
        }
      ]

      iap_config = {
        enable               = false
        oauth2_client_id     = ""
        oauth2_client_secret = ""
      }
    }
  }
}

resource "google_compute_backend_bucket" "static_website" {
  project = data.google_project.project.project_id
  name        = "static-website-backend-bucket"
  description = "Contains a static website"
  bucket_name = google_storage_bucket.static_website.name
  enable_cdn  = true
}

resource "google_compute_url_map" "ml-bkd-ml-mig-bckt-s-lb" {
  // note that this is the name of the load balancer
  name            = google_compute_network.default.name
  default_service = google_compute_backend_bucket.static_website.self_link

  host_rule {
    hosts        = ["*"]
    path_matcher = "allpaths"
  }

  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_bucket.static_website.self_link

    path_rule {
      paths = [
        "/api",
        "/api/*"
      ]
      service = module.gce-lb-https.backend_services["api"].self_link
    }
  }
}
