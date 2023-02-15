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

# tfdoc:file:description SSL certificates.

resource "google_compute_region_ssl_certificate" "certificates" {
  for_each    = var.ssl_certificates_config
  project     = var.project_id
  name        = "${var.name}-${each.key}"
  certificate = try(each.value.tls_self_signed_cert, null)
  private_key = try(each.value.tls_private_key, null)
  region      = var.region
}
