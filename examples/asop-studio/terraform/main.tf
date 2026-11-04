# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  use_iap = var.enable_iap || var.iap_client_id != ""
  sa_id   = trimsuffix(substr("${var.service_name}-runner", 0, 28), "-")
}

# 1. Cloud Run Service Account (empty IAM roles for least-privilege isolation)
resource "google_service_account" "cloud_run_sa" {
  account_id   = local.sa_id
  display_name = "${var.service_name} Cloud Run Service Account"
}

# 1.1 Artifact Registry repository for ASOP Studio Docker images
resource "google_artifact_registry_repository" "asop_repo" {
  location      = var.region
  repository_id = "${var.service_name}-repo"
  description   = "ASOP Studio Docker registry (${var.service_name})"
  format        = "DOCKER"
}

# 2. Cloud Run Service using Container Volatile Disk
resource "google_cloud_run_v2_service" "asop_service" {
  name     = var.service_name
  location = var.region
  ingress  = local.use_iap ? "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER" : "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloud_run_sa.email

    containers {
      image = var.image_url

      ports {
        container_port = 8080
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image
    ]
  }
}

# 3. Serverless NEG for Cloud Run (only when IAP Load Balancer is enabled)
resource "google_compute_region_network_endpoint_group" "serverless_neg" {
  count                 = local.use_iap ? 1 : 0
  name                  = "${var.service_name}-serverless-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run {
    service = google_cloud_run_v2_service.asop_service.name
  }
}

# 4. Global External Static IP Address (only when IAP Load Balancer is enabled)
resource "google_compute_global_address" "lb_ip" {
  count = local.use_iap ? 1 : 0
  name  = "${var.service_name}-lb-static-ip"
}

# 5. Self-Signed SSL Certificate for HTTPS Load Balancer IP access
resource "tls_private_key" "self_signed_key" {
  count     = local.use_iap ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_self_signed_cert" "self_signed" {
  count           = local.use_iap ? 1 : 0
  private_key_pem = tls_private_key.self_signed_key[0].private_key_pem

  subject {
    common_name  = google_compute_global_address.lb_ip[0].address
    organization = "ASOP Studio Self-Signed"
  }

  validity_period_hours = 8760 # 1 year

  allowed_uses = [
    "key_encipherment",
    "digital_signature",
    "server_auth",
  ]
}

resource "google_compute_ssl_certificate" "self_signed_cert" {
  count       = local.use_iap ? 1 : 0
  name        = "${var.service_name}-self-signed-cert"
  private_key = tls_private_key.self_signed_key[0].private_key_pem
  certificate = tls_self_signed_cert.self_signed[0].cert_pem
}

# 5.1 Google-Managed SSL Certificate for custom domain access
resource "google_compute_managed_ssl_certificate" "managed_cert" {
  count = local.use_iap && var.domain_name != "" ? 1 : 0
  name  = "${var.service_name}-managed-cert"

  managed {
    domains = [var.domain_name]
  }
}

# 6. Backend Service with IAP Enabled
resource "google_compute_backend_service" "backend_service" {
  count                 = local.use_iap ? 1 : 0
  name                  = "${var.service_name}-backend-service"
  protocol              = "HTTP"
  port_name             = "http"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.serverless_neg[0].id
  }

  iap {
    oauth2_client_id     = var.iap_client_id
    oauth2_client_secret = var.iap_client_secret
  }
}

# 7. URL Map
resource "google_compute_url_map" "url_map" {
  count           = local.use_iap ? 1 : 0
  name            = "${var.service_name}-load-balancer"
  default_service = google_compute_backend_service.backend_service[0].id
}

# 8. Target HTTPS Proxy
resource "google_compute_target_https_proxy" "https_proxy" {
  count            = local.use_iap ? 1 : 0
  name             = "${var.service_name}-https-proxy"
  url_map          = google_compute_url_map.url_map[0].id
  ssl_certificates = var.domain_name != "" ? [google_compute_managed_ssl_certificate.managed_cert[0].id] : [google_compute_ssl_certificate.self_signed_cert[0].id]
}

# 9. HTTPS Forwarding Rule
resource "google_compute_global_forwarding_rule" "https_rule" {
  count                 = local.use_iap ? 1 : 0
  name                  = "${var.service_name}-https-forwarding-rule"
  target                = google_compute_target_https_proxy.https_proxy[0].id
  port_range            = "443"
  ip_address            = google_compute_global_address.lb_ip[0].address
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# 10. HTTP redirection to HTTPS
resource "google_compute_url_map" "redirect_url_map" {
  count = local.use_iap ? 1 : 0
  name  = "${var.service_name}-http-redirect-map"
  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "http_proxy" {
  count   = local.use_iap ? 1 : 0
  name    = "${var.service_name}-http-proxy"
  url_map = google_compute_url_map.redirect_url_map[0].id
}

resource "google_compute_global_forwarding_rule" "http_rule" {
  count                 = local.use_iap ? 1 : 0
  name                  = "${var.service_name}-http-forwarding-rule"
  target                = google_compute_target_http_proxy.http_proxy[0].id
  port_range            = "80"
  ip_address            = google_compute_global_address.lb_ip[0].address
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# 11. IAP Access IAM Binding (when IAP is enabled)
resource "google_iap_web_backend_service_iam_member" "iap_restricted_users" {
  for_each            = local.use_iap ? toset(var.allowed_identities) : toset([])
  project             = var.project_id
  web_backend_service = google_compute_backend_service.backend_service[0].name
  role                = "roles/iap.httpsResourceAccessor"
  member              = each.key
}

# 12. Cloud Run Invoker IAM
# - When IAP is enabled, Cloud Run ingress is restricted to internal/load-balancer only, and the LB invokes Cloud Run.
# - When IAP is disabled and allow_unauthenticated = true, Cloud Run is directly accessible via its HTTPS URL.
resource "google_cloud_run_v2_service_iam_member" "cloud_run_invoker" {
  count    = local.use_iap || var.allow_unauthenticated ? 1 : 0
  project  = var.project_id
  location = google_cloud_run_v2_service.asop_service.location
  name     = google_cloud_run_v2_service.asop_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "cloud_run_authenticated_users" {
  for_each = !local.use_iap && !var.allow_unauthenticated ? toset(var.allowed_identities) : toset([])
  project  = var.project_id
  location = google_cloud_run_v2_service.asop_service.location
  name     = google_cloud_run_v2_service.asop_service.name
  role     = "roles/run.invoker"
  member   = each.key
}
