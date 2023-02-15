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

output "credential" {
  description = "Credential configuration file contents."
  value = templatefile("${path.module}/credential.json", {
    project_number        = module.prj.project_id
    app_id_uri            = "api://${local.app_name}"
    pool_id               = google_iam_workload_identity_pool.pool.workload_identity_pool_id
    provider_id           = google_iam_workload_identity_pool_provider.provider.workload_identity_pool_provider_id
    service_account_email = module.sa.email
  })
}

output "tls_private_key" {
  description = "Private key required to log in to the Azure VM via SSH."
  value       = var.vm_test ? tls_private_key.private_key[0].private_key_pem : null
  sensitive   = true
}

output "username" {
  description = "Username required to log in to the Azure VM via SSH."
  value       = var.vm_test ? local.username : null
}

output "vm_public_ip_address" {
  description = "Azure VM public IP address."
  value       = var.vm_test ? azurerm_public_ip.public_ip[0].ip_address : null
}
