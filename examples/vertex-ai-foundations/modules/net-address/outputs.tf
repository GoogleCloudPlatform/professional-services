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

output "external_addresses" {
  description = "Allocated external addresses."
  value = {
    for address in google_compute_address.external :
    address.name => {
      address   = address.address
      self_link = address.self_link
    }
  }
}

output "global_addresses" {
  description = "Allocated global external addresses."
  value = {
    for address in google_compute_global_address.global :
    address.name => {
      address   = address.address
      self_link = address.self_link
    }
  }
}

output "internal_addresses" {
  description = "Allocated internal addresses."
  value = {
    for address in google_compute_address.internal :
    address.name => {
      address   = address.address
      self_link = address.self_link
    }
  }
}

output "psa_addresses" {
  description = "Allocated internal addresses for PSA endpoints."
  value = {
    for address in google_compute_global_address.psa :
    address.name => {
      address       = address.address
      prefix_length = address.prefix_length
      self_link     = address.self_link
    }
  }
}

output "psc_addresses" {
  description = "Allocated internal addresses for PSC endpoints."
  value = {
    for address in google_compute_global_address.psc :
    address.name => {
      address   = address.address
      self_link = address.self_link
    }
  }
}
