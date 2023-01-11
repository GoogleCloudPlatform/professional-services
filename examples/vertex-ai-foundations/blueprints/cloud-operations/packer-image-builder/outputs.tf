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

output "builder_sa" {
  description = "Packer's service account email."
  value       = module.service-account-image-builder.email
}

output "compute_sa" {
  description = "Packer's temporary VM service account email."
  value       = module.service-account-image-builder-vm.email
}

output "compute_subnetwork" {
  description = "Name of a subnetwork for Packer's temporary VM."
  value       = local.compute_subnet_name
}

output "compute_zone" {
  description = "Name of a compute engine zone for Packer's temporary VM."
  value       = local.compute_zone
}

