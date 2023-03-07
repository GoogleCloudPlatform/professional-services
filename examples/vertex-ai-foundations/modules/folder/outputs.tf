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
output "firewall_policies" {
  description = "Map of firewall policy resources created in this folder."
  value       = { for k, v in google_compute_firewall_policy.policy : k => v }
}

output "firewall_policy_id" {
  description = "Map of firewall policy ids created in this folder."
  value       = { for k, v in google_compute_firewall_policy.policy : k => v.id }
}

output "folder" {
  description = "Folder resource."
  value       = local.folder
}

output "id" {
  description = "Folder id."
  value       = local.folder.name
  depends_on = [
    google_folder_iam_binding.authoritative,
    google_org_policy_policy.default,
  ]
}

output "name" {
  description = "Folder name."
  value       = local.folder.display_name
}

output "sink_writer_identities" {
  description = "Writer identities created for each sink."
  value = {
    for name, sink in google_logging_folder_sink.sink : name => sink.writer_identity
  }
}
