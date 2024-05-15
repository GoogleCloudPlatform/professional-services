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

resource "google_privateca_ca_pool" "pool" {
  name        = var.name
  project     = var.project_id
  location    = var.location
  tier        = var.tier
  
  publishing_options {
    publish_ca_cert = true
    publish_crl = true
  }

  dynamic "issuance_policy" {
    for_each = var.type == "SUBORDINATE" ? [1] : []
    content {
      baseline_values {
        ca_options {
          is_ca = false
        }
        key_usage {
          base_key_usage {
            cert_sign           = false
            crl_sign            = false
            digital_signature   = false
            content_commitment  = false
            key_encipherment    = false
            data_encipherment   = false
            key_agreement       = false
            decipher_only       = false
          }
          extended_key_usage {
            server_auth         = true
            client_auth         = true
            email_protection    = true
            code_signing        = true
            time_stamping       = true
          }
        }
      }
    }
  }
}