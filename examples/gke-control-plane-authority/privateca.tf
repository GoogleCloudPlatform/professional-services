/**
 * Copyright 2025 Google LLC
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

resource "google_privateca_ca_pool" "ca-pools" {
  depends_on = [google_kms_crypto_key.cluster-signing-keys]
  for_each   = { for key in google_kms_crypto_key.cluster-signing-keys : key.name => key.id }
  name       = "${var.cluster_name}-${each.key}"
  location   = var.region
  tier       = "ENTERPRISE"
  issuance_policy {
    maximum_lifetime = var.root_ca_certs_maximum_lifetime
  }
  publishing_options {
    publish_ca_cert = false
    publish_crl     = false
    encoding_format = "PEM"
  }
  labels = local.labels
}

resource "google_privateca_certificate_authority" "cluster-ca-root" {
  depends_on = [google_privateca_ca_pool.ca-pools]
  for_each   = { for key in google_kms_crypto_key.cluster-signing-keys : key.name => key.id }
  location   = var.region
  pool       = google_privateca_ca_pool.ca-pools[each.key].name

  certificate_authority_id = each.key
  config {
    subject_config {
      subject {
        organization = var.org_id
        common_name  = each.key
      }
    }
    x509_config {
      ca_options {
        is_ca                  = true
        max_issuer_path_length = local.ca_max_issuer_path_length
      }
      key_usage {
        base_key_usage {
          digital_signature  = true
          content_commitment = true
          key_encipherment   = true
          data_encipherment  = true
          key_agreement      = true
          cert_sign          = true
          crl_sign           = true
          decipher_only      = true
        }
        extended_key_usage {
          server_auth      = true
          client_auth      = true
          email_protection = true
          code_signing     = true
          time_stamping    = true
        }
      }
    }
  }
  key_spec {
    cloud_kms_key_version = data.google_kms_crypto_key_latest_version.cluster-signing-keys-version[each.key].name
  }
  lifetime                               = var.root_ca_lifetime
  deletion_protection                    = false
  skip_grace_period                      = true
  ignore_active_certificates_on_deletion = true

  labels = local.labels
}

# wait for CA Pool IAM propagation
resource "time_sleep" "wait" {
  depends_on      = [google_privateca_ca_pool_iam_policy.ca-pools-iam]
  create_duration = var.wait_duration
}
