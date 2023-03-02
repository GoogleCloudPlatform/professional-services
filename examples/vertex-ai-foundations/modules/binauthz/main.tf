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

resource "google_binary_authorization_policy" "policy" {
  project = var.project_id
  dynamic "admission_whitelist_patterns" {
    for_each = toset(coalesce(var.admission_whitelist_patterns, []))
    content {
      name_pattern = admission_whitelist_patterns.value
    }
  }
  default_admission_rule {
    evaluation_mode         = var.default_admission_rule.evaluation_mode
    enforcement_mode        = var.default_admission_rule.enforcement_mode
    require_attestations_by = [for attestor in coalesce(var.default_admission_rule.attestors, []) : google_binary_authorization_attestor.attestors[attestor].name]
  }
  dynamic "cluster_admission_rules" {
    for_each = coalesce(var.cluster_admission_rules, {})
    content {
      cluster                 = cluster_admission_rules.key
      evaluation_mode         = cluster_admission_rules.value.evaluation_mode
      enforcement_mode        = cluster_admission_rules.value.enforcement_mode
      require_attestations_by = [for attestor in cluster_admission_rules.value.attestors : google_binary_authorization_attestor.attestors[attestor].name]
    }
  }
}

resource "google_binary_authorization_attestor" "attestors" {
  for_each = coalesce(var.attestors_config, {})
  name     = each.key
  project  = var.project_id
  attestation_authority_note {
    note_reference = each.value.note_reference == null ? google_container_analysis_note.notes[each.key].name : each.value.note_reference
    dynamic "public_keys" {
      for_each = coalesce(each.value.pgp_public_keys, [])
      content {
        ascii_armored_pgp_public_key = public_keys.value
      }
    }
    dynamic "public_keys" {
      for_each = {
        for pkix_public_key in coalesce(each.value.pkix_public_keys, []) :
        "${pkix_public_key.public_key_pem}-${pkix_public_key.signature_algorithm}" => pkix_public_key
      }
      content {
        id = public_keys.value.id
        pkix_public_key {
          public_key_pem      = public_keys.value.public_key_pem
          signature_algorithm = public_keys.value.signature_algorithm
        }
      }
    }
  }
}

resource "google_binary_authorization_attestor_iam_binding" "bindings" {
  for_each = merge(flatten([
    for name, attestor_config in var.attestors_config : { for role, members in coalesce(attestor_config.iam, {}) : "${name}-${role}" => {
      name    = name
      role    = role
      members = members
  } }])...)
  project  = google_binary_authorization_attestor.attestors[each.value.name].project
  attestor = google_binary_authorization_attestor.attestors[each.value.name].name
  role     = each.value.role
  members  = each.value.members
}

resource "google_container_analysis_note" "notes" {
  for_each = toset([for name, attestor_config in var.attestors_config : name if attestor_config.note_reference == null])
  name     = "${each.value}-note"
  project  = var.project_id
  attestation_authority {
    hint {
      human_readable_name = "Attestor ${each.value} note"
    }
  }
}
