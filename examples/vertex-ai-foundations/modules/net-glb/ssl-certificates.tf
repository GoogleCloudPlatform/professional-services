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

locals {
  # If the HTTPS target proxy has no SSL certs
  # set, create also a default managed SSL cert
  ssl_certificates_config = merge(
    coalesce(var.ssl_certificates_config, {}),
    try(length(var.target_proxy_https_config.ssl_certificates), 0) == 0
    ? { default = var.ssl_certificates_config_defaults }
    : {}
  )

  ssl_certs_managed = (
    var.https
    ? {
      for k, v in coalesce(local.ssl_certificates_config, {}) :
      k => v if v.unmanaged_config == null
    }
    : {}
  )
  ssl_certs_unmanaged = (
    var.https
    ? {
      for k, v in coalesce(local.ssl_certificates_config, {}) :
      k => v if v.unmanaged_config != null
    }
    : {}
  )
}

resource "google_compute_managed_ssl_certificate" "managed" {
  for_each = local.ssl_certs_managed
  project  = var.project_id
  name     = "${var.name}-${each.key}"
  managed {
    domains = try(each.value.domains, null)
  }
}

resource "google_compute_ssl_certificate" "unmanaged" {
  for_each    = local.ssl_certs_unmanaged
  project     = var.project_id
  name        = "${var.name}-${each.key}"
  certificate = try(each.value.unmanaged_config.tls_self_signed_cert, null)
  private_key = try(each.value.unmanaged_config.tls_private_key, null)
}
