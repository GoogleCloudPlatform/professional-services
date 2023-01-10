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

output "default_rules" {
  description = "Default rule resources."
  value = {
    admin = try(google_compute_firewall.allow-admins, null)
    http  = try(google_compute_firewall.allow-tag-http, null)
    https = try(google_compute_firewall.allow-tag-https, null)
    ssh   = try(google_compute_firewall.allow-tag-ssh, null)
  }
}

output "rules" {
  description = "Custom rule resources."
  value       = google_compute_firewall.custom-rules
}
