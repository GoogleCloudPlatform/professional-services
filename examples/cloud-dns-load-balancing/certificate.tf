/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
module "certificate" {
  for_each          = var.locations
  source            = "./modules/certificate"
  project_id        = var.project_id
  location          = each.key

  ca_pool_name      = var.ca_pool_name
  ca_pool_location  = local.location1
  domain            = var.domain

  reusable_config   = var.reusable_config
  lifetime          = var.lifetime
  algorithm         = var.algorithm
  tier              = var.tier
  type              = var.type
  common_name       = var.common_name
  organization_name = var.organization_name
  country_code      = var.country_code
  locality          = var.locality
  province          = var.province
  organizational_unit = var.organizational_unit
}

resource "google_compute_ssl_certificate" "managed-cert" {
  project     = var.project_id
  name_prefix = "cert-"
  private_key = module.certificate[local.location1].private_key
  certificate = module.certificate[local.location1].public_key

  lifecycle {
    create_before_destroy = true
  }
}


resource "google_certificate_manager_certificate_issuance_config" "issuanceconfig" {
  name    = "issuance-config"
  certificate_authority_config {
    certificate_authority_service_config {
        ca_pool = "projects/${var.project_id}/locations/${local.location1}/caPools/${var.ca_pool_name}"
    }
  }
  lifetime = "1814400s"
  rotation_window_percentage = 34
  key_algorithm = "ECDSA_P256"
}
resource "google_certificate_manager_certificate" "ccm-cert" {
  name        = "ccm-cert"
  scope       = "ALL_REGIONS"
  managed {
    domains = [
        var.domain
      ]
    issuance_config = google_certificate_manager_certificate_issuance_config.issuanceconfig.id
  }
}
