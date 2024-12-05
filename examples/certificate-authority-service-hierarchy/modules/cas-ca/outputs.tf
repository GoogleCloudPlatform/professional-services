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

output "name" {
    value = google_privateca_certificate_authority.ca.certificate_authority_id
}

output "id" {
    value = google_privateca_certificate_authority.ca.id
}

output "keyring_id" {    
    value = google_kms_key_ring.ca_keyring.id
}

output "crypto_key_id" {    
    value = google_kms_crypto_key.ca_key.id
}
