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

output "dns_keys" {
  description = "DNSKEY and DS records of DNSSEC-signed managed zones."
  value       = local.dns_keys
}

output "domain" {
  description = "The DNS zone domain."
  value       = try(local.zone.dns_name, null)
}

output "name" {
  description = "The DNS zone name."
  value       = try(local.zone.name, null)
}

output "name_servers" {
  description = "The DNS zone name servers."
  value       = try(local.zone.name_servers, null)
}

output "type" {
  description = "The DNS zone type."
  value       = var.type
}

output "zone" {
  description = "DNS zone resource."
  value       = local.zone
}
