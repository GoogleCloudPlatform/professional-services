/**
 * Copyright 2024 Google LLC
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

output "custom_constraint_ids" {
  description = "Map of CUSTOM_CONSTRAINTS => ID in the organization."
  value       = { for k, v in google_org_policy_custom_constraint.constraint : k => v.id }
}

output "custom_role_id" {
  description = "Map of custom role IDs created in the organization."
  value = {
    for k, v in google_organization_iam_custom_role.roles :
    # build the string manually so that role IDs can be used as map
    # keys (useful for folder/organization/project-level iam bindings)
    (k) => "${var.organization_id}/roles/${local.custom_roles[k].name}"
  }
}

output "custom_roles" {
  description = "Map of custom roles resources created in the organization."
  value       = google_organization_iam_custom_role.roles
}

output "id" {
  description = "Fully qualified organization id."
  value       = var.organization_id
  depends_on = [
    google_logging_organization_settings.default,
    google_org_policy_custom_constraint.constraint,
    google_org_policy_policy.default,
    google_organization_iam_binding.authoritative,
    google_organization_iam_binding.bindings,
    google_organization_iam_custom_role.roles,
    google_organization_iam_member.bindings,
    google_tags_tag_key.default,
    google_tags_tag_key_iam_binding.default,
    google_tags_tag_value.default,
    google_tags_tag_value_iam_binding.default,
  ]
}

output "network_tag_keys" {
  description = "Tag key resources."
  value = {
    for k, v in google_tags_tag_key.default : k => v if(
      v.purpose != null && v.purpose != ""
    )
  }
}

output "network_tag_values" {
  description = "Tag value resources."
  value = {
    for k, v in google_tags_tag_value.default :
    k => v if local.tag_values[k].tag_network
  }
}

# TODO: deprecate in favor of id

output "organization_id" {
  description = "Organization id dependent on module resources."
  value       = var.organization_id
  depends_on = [
    google_org_policy_custom_constraint.constraint,
    google_org_policy_policy.default,
    google_organization_iam_binding.authoritative,
    google_organization_iam_binding.bindings,
    google_organization_iam_member.bindings,
    google_organization_iam_custom_role.roles,
    google_tags_tag_key.default,
    google_tags_tag_key_iam_binding.default,
    google_tags_tag_value.default,
    google_tags_tag_value_iam_binding.default,
  ]
}

output "sink_writer_identities" {
  description = "Writer identities created for each sink."
  value = {
    for name, sink in google_logging_organization_sink.sink :
    name => sink.writer_identity
  }
}

output "tag_keys" {
  description = "Tag key resources."
  value = {
    for k, v in google_tags_tag_key.default : k => v if(
      v.purpose == null || v.purpose == ""
    )
  }
}

output "tag_values" {
  description = "Tag value resources."
  value = {
    for k, v in google_tags_tag_value.default :
    k => v if !local.tag_values[k].tag_network
  }
}
