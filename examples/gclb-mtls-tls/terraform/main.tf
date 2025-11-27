# Copyright 2025 Google Inc. All Rights Reserved.

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

locals {
  project_id = "gcp-project-id" // Update GCP_PROJECT_ID
  vpc_networks = [
    "default"
  ]
  vpc_projects = [
    "gcp-project-id", // Update GCP_PROJECT_ID of vpc network project.
  ]
  zonal_neg_configs = [
    { "name" : "mtls-demo-neg", "zone" : "us-central1-a" },
  ]
}

data "google_project" "project" {
  project_id = local.project_id
}

# create trust config
resource "google_certificate_manager_trust_config" "default" {
  name        = "mtls-demo-trust-config"
  project     = local.project_id
  description = "Trust config for mTLS demo app"
  location    = "global"

  trust_stores {
    trust_anchors {
      pem_certificate = file("certs/root.cert")
    }
    intermediate_cas {
      pem_certificate = file("certs/int.cert")
    }
    intermediate_cas {
      pem_certificate = file("certs/int2.cert")
    }
  }
}

# Create server tls policy
resource "google_network_security_server_tls_policy" "default" {
  provider    = google-beta
  name        = "mtls-demo-server-tls-policy"
  project     = local.project_id
  description = "mTLS Demo server tls policy"
  location    = "global"
  allow_open  = "false"
  mtls_policy {
    client_validation_mode         = "REJECT_INVALID" # REJECT_INVALID , ALLOW_INVALID_OR_MISSING_CLIENT_CERT
    client_validation_trust_config = "projects/${data.google_project.project.number}/locations/global/trustConfigs/${google_certificate_manager_trust_config.default.name}"
  }
}

# HTTPS proxy for tls traffic only
resource "google_compute_target_https_proxy" "tls-proxy" {
  project = local.project_id
  name    = "mtls-demo-tls-https-proxy"
  url_map = join("", module.gce-lb-http.url_map)

  ssl_certificates = module.gce-lb-http.ssl_certificate_created
}

# External Global IP address for tls frontend
resource "google_compute_global_address" "tls-ip" {
  provider   = google-beta
  project    = local.project_id
  name       = "mtls-demo-ip-tls"
  ip_version = "IPV4"
}

# External Global IP address for mtls frontend
resource "google_compute_global_address" "mtls-ip" {
  provider   = google-beta
  project    = local.project_id
  name       = "mtls-demo-ip-mtls"
  ip_version = "IPV4"
}

# Attach the https proxy to forwarding rule
resource "google_compute_global_forwarding_rule" "tls-https" {
  provider              = google-beta
  project               = local.project_id
  name                  = "mtls-demo-tls-https"
  target                = google_compute_target_https_proxy.tls-proxy.self_link
  ip_address            = google_compute_global_address.tls-ip.address
  port_range            = 443
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# create load balancer
module "gce-lb-http" {
  source  = "GoogleCloudPlatform/lb-http/google"
  version = "10.2.0"

  project                = local.project_id
  name                   = "mtls-demo"
  load_balancing_scheme  = "EXTERNAL_MANAGED"
  create_address         = false
  address                = google_compute_global_address.mtls-ip.address
  firewall_networks      = local.vpc_networks
  firewall_projects      = local.vpc_projects
  create_url_map         = true
  ssl                    = true
  create_ssl_certificate = true
  certificate            = file("certs/server.cert")
  private_key            = file("certs/un-server.key")
  http_forward           = false
  server_tls_policy      = google_network_security_server_tls_policy.default.id
  backends = {
    default = {
      protocol    = "HTTP"
      timeout_sec = 60
      enable_cdn  = false
      custom_request_headers = [
        "X-Client-Cert-Present: {client_cert_present}",
        "X-Client-Cert-Chain-Verified: {client_cert_chain_verified}",
        "X-Client-Cert-Error: {client_cert_error}",
        "X-Client-Cert-Hash: {client_cert_sha256_fingerprint}",
        "X-Client-Cert-Serial-Number: {client_cert_serial_number}",
        "X-Client-Cert-SPIFFE: {client_cert_spiffe_id}",
        "X-Client-Cert-URI-SANs: {client_cert_uri_sans}",
        "X-Client-Cert-DNSName-SANs: {client_cert_dnsname_sans}",
        "X-Client-Cert-Valid-Not-Before: {client_cert_valid_not_before}",
        "X-Client-Cert-Valid-Not-After: {client_cert_valid_not_after}",
        "X-Client-Cert-Issuer-Dn: {client_cert_issuer_dn}",
        "X-Client-Cert-Subject-Dn: {client_cert_subject_dn}",
        "X-Client-Cert-Leaf: {client_cert_leaf}"
      ]
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
