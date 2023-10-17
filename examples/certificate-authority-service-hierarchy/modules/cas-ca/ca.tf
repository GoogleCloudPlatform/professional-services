/**
 * Copyright 2023 Google LLC
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

resource "google_privateca_certificate_authority" "ca" {
  certificate_authority_id  = var.ca_name
  project                   = var.project_id
  location                  = var.location
  type                      = var.type
  pool                      = var.ca_pool_name

  # Reference to the signed CSR for manual CA actication
  # pem_ca_certificate       = file("ca.pem")
  dynamic "subordinate_config" {
    for_each = var.type == "SUBORDINATE" ? [1] : []
    content {
      # Reference to the Root CA in CAS for automatic CA activation
      certificate_authority = var.root_ca_id
      
      # Reference to the signed CSR for manual CA actication
      # pem_issuer_chain  = {
      #   pem_certificates = [file("issuer-ca.pem")]
      # }
    }
  }

  config {
    subject_config {
      subject {
        country_code        = var.country_code
        organization        = var.organization_name
        organizational_unit = var.organizational_unit
        locality            = var.locality
        province            = var.province
        common_name         = var.common_name
      }
    }

    dynamic "x509_config" {
      for_each = var.type == "SELF_SIGNED" ? [1] : []
      content {
        ca_options {
          is_ca                  = true
        }
        key_usage {
          base_key_usage {
            crl_sign            = true
            cert_sign           = true
          }
          extended_key_usage {
            server_auth       = false
          }
        }
      }
    }

    dynamic "x509_config" {
      for_each = var.type == "SUBORDINATE" ? [1] : []
      content {
        ca_options {
          is_ca = true
          # Force the sub CA to only issue leaf certs
          max_issuer_path_length = 0
        }
        key_usage {
          base_key_usage {
            digital_signature   = true
            content_commitment  = true
            key_encipherment    = false
            data_encipherment   = true
            key_agreement       = true
            cert_sign           = true
            crl_sign            = true
            decipher_only       = true
          }
          extended_key_usage {
            server_auth         = true
            client_auth         = true
            email_protection    = true
            code_signing        = true
            time_stamping       = true
          }
        }
/*
        name_constraints {
          critical                  = true
          permitted_dns_names       = ["*.example.com"]
          excluded_dns_names        = ["*.deny.example.com"]
          permitted_ip_ranges       = ["10.0.0.0/8"]
          excluded_ip_ranges        = ["10.1.1.0/24"]
          permitted_email_addresses = [".example.com"]
          excluded_email_addresses  = [".deny.example.com"]
          permitted_uris            = [".example.com"]
          excluded_uris             = [".deny.example.com"]
        }
*/
      }
    }
  }
  lifetime = var.lifetime
  key_spec {
    # Use algorithm for Google managed CA key
    # algorithm = var.algorithm

    # Specify the Cloud KMS/HSM key version resource id for customer managed CA key
    cloud_kms_key_version = "${google_kms_crypto_key.ca_key.id}/cryptoKeyVersions/1"
  }

  ignore_active_certificates_on_deletion  = true    # Disable if wish to save issued certificate when destroyed
  deletion_protection                     = false   # Disable if wish to preserve from being destroyed
  skip_grace_period                       = true 

  depends_on = [
    google_kms_crypto_key_iam_binding.privateca_sa_keyuser_signerverifier,
    google_kms_crypto_key_iam_binding.privateca_sa_keyuser_viewer,
  ]
}