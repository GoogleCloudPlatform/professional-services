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

 locals {
   template_name = "${var.sub_ca1_name}-template"
 }

resource "google_privateca_certificate_template" "acme_team" {
  project     = var.project_id
  location    = var.location1
  name        = local.template_name
  description = "A sample certificate template"

  identity_constraints {
    allow_subject_alt_names_passthrough = true
    allow_subject_passthrough           = true

    cel_expression {
      title       = "Subdomain restriction"
      description = "Check that the requested domain is a permitted subdomain"
      expression  = "subject_alt_names.all(san, san.type == DNS && san.value.endsWith(\".${var.domain}\"))"
    }
  }
/*
  passthrough_extensions {
    additional_extensions {
      object_id_path = [1, 6]
    }

    known_extensions = ["EXTENDED_KEY_USAGE"]
  }

  predefined_values {
    additional_extensions {
      object_id {
        object_id_path = [1, 6]
      }

      value    = "c3RyaW5nCg=="
      critical = true
    }

    aia_ocsp_servers = ["string"]

    ca_options {
      is_ca                  = false
      max_issuer_path_length = 6
    }

    key_usage {
      base_key_usage {
        cert_sign          = false
        content_commitment = true
        crl_sign           = false
        data_encipherment  = true
        decipher_only      = true
        digital_signature  = true
        encipher_only      = true
        key_agreement      = true
        key_encipherment   = true
      }

      extended_key_usage {
        client_auth      = true
        code_signing     = true
        email_protection = true
        ocsp_signing     = true
        server_auth      = true
        time_stamping    = true
      }

      unknown_extended_key_usages {
        object_id_path = [1, 6]
      }
    }

    policy_ids {
      object_id_path = [1, 6]
    }
  }

  labels = {
    label-two = "value-two"
  }
*/
}

resource "google_privateca_certificate_template_iam_binding" "acme_team" {
  certificate_template = google_privateca_certificate_template.acme_team.id
  role = "roles/privateca.templateUser"
  members = [
    google_service_account.acme_sa.member
  ]
}

resource "google_privateca_ca_pool_iam_binding" "acme_team" {
  ca_pool = module.sub-pool1.id
  role = "roles/privateca.certificateRequester"
  members = [
    google_service_account.acme_sa.member
  ]

  condition {
    title       = "ACME Certificate Template users only"
    description = "ACME Certificate Template users only"
    expression  = "api.getAttribute('privateca.googleapis.com/template', '') == '${var.project_id}/-/${local.template_name}'"
    # Alternatively, here's how you could restrict the certificate domain in the IAM condition directly:
    # expression  = "api.getAttribute('privateca.googleapis.com/subject_alt_names', []).hasOnly(['dns:sample1.prod.example.com', 'dns:sample2.prod.example.com'])"
  }
}


resource "google_service_account" "acme_sa" {
  account_id   = "acme-team-sa"
  display_name = "ACME Team Service Account"
}

resource "google_service_account" "not_acme_sa" {
  account_id   = "non-acme-team-sa"
  display_name = "Not an ACME Team Service Account"
}