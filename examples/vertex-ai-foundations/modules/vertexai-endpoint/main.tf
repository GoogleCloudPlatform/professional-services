/**
 * Copyright 2022 Google LLC
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

# Docs: https://registry.terraform.io/providers/hashicorp/google-beta/latest/docs/resources/vertex_ai_endpoint

resource "random_id" "endpoint_id" {
  byte_length = 4
}

resource "google_vertex_ai_endpoint" "endpoint" {
  provider     = google-beta
  name         = try(var.name,substr(random_id.endpoint_id.dec, 0, 10))
  display_name = var.display_name
  description  = var.description
  location     = var.location
  labels       = var.labels
  network      = var.vpc_network.full_name
  dynamic "encryption_spec" {
    for_each = var.encryption_key == null ? [] : [""]
    content {
        kms_key_name = var.encryption_key
    }
  }

  depends_on   = [
    google_service_networking_connection.vertex_vpc_connection
  ]
}

resource "google_service_networking_connection" "vertex_vpc_connection" {
  network                 = var.vpc_network.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.vertex_range.name]
}

resource "google_compute_global_address" "vertex_range" {
  name          = var.global_address_name
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = var.prefix_length
  network       = var.vpc_network.id
  dynamic "address" {
    for_each = var.address_range == null ? [] : [""]
    content {
        address = var.address_range
    }
  }
}

resource "google_kms_crypto_key_iam_member" "encryption_key_member" {
  for_each      = toset(var.kms_service_account)
  crypto_key_id = var.encryption_key
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = each.key
}