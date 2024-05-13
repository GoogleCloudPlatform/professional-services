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

# tfdoc:file:description Log sinks and data access logs.

locals {
  logging_sinks = {
    for k, v in var.logging_sinks :
    # rewrite destination and type when type="project"
    k => merge(v, v.type != "project" ? {} : {
      destination = "projects/${v.destination}"
      type        = "logging"
    })
  }
  sink_bindings = {
    for type in ["bigquery", "logging", "project", "pubsub", "storage"] :
    type => {
      for name, sink in var.logging_sinks :
      name => sink if sink.iam && sink.type == type
    }
  }
}

resource "google_logging_organization_settings" "default" {
  count                = var.logging_settings != null ? 1 : 0
  organization         = local.organization_id_numeric
  disable_default_sink = var.logging_settings.disable_default_sink
  storage_location     = var.logging_settings.storage_location
}

resource "google_organization_iam_audit_config" "default" {
  for_each = var.logging_data_access
  org_id   = local.organization_id_numeric
  service  = each.key
  dynamic "audit_log_config" {
    for_each = each.value
    iterator = config
    content {
      log_type         = config.key
      exempted_members = config.value
    }
  }
}

resource "google_logging_organization_sink" "sink" {
  for_each         = local.logging_sinks
  name             = each.key
  description      = coalesce(each.value.description, "${each.key} (Terraform-managed).")
  org_id           = local.organization_id_numeric
  destination      = "${each.value.type}.googleapis.com/${each.value.destination}"
  filter           = each.value.filter
  include_children = each.value.include_children
  disabled         = each.value.disabled

  dynamic "bigquery_options" {
    for_each = each.value.type == "bigquery" ? [""] : []
    content {
      use_partitioned_tables = each.value.bq_partitioned_table
    }
  }

  dynamic "exclusions" {
    for_each = each.value.exclusions
    iterator = exclusion
    content {
      name   = exclusion.key
      filter = exclusion.value
    }
  }
  depends_on = [
    google_organization_iam_binding.authoritative,
    google_organization_iam_binding.bindings,
    google_organization_iam_member.bindings
  ]
}

resource "google_storage_bucket_iam_member" "storage-sinks-binding" {
  for_each = local.sink_bindings["storage"]
  bucket   = each.value.destination
  role     = "roles/storage.objectCreator"
  member   = google_logging_organization_sink.sink[each.key].writer_identity
}

resource "google_bigquery_dataset_iam_member" "bq-sinks-binding" {
  for_each   = local.sink_bindings["bigquery"]
  project    = split("/", each.value.destination)[1]
  dataset_id = split("/", each.value.destination)[3]
  role       = "roles/bigquery.dataEditor"
  member     = google_logging_organization_sink.sink[each.key].writer_identity
}

resource "google_pubsub_topic_iam_member" "pubsub-sinks-binding" {
  for_each = local.sink_bindings["pubsub"]
  project  = split("/", each.value.destination)[1]
  topic    = split("/", each.value.destination)[3]
  role     = "roles/pubsub.publisher"
  member   = google_logging_organization_sink.sink[each.key].writer_identity
}

resource "google_project_iam_member" "bucket-sinks-binding" {
  for_each = local.sink_bindings["logging"]
  project  = split("/", each.value.destination)[1]
  role     = "roles/logging.bucketWriter"
  member   = google_logging_organization_sink.sink[each.key].writer_identity

  condition {
    title       = "${each.key} bucket writer"
    description = "Grants bucketWriter to ${google_logging_organization_sink.sink[each.key].writer_identity} used by log sink ${each.key} on ${var.organization_id}"
    expression  = "resource.name.endsWith('${each.value.destination}')"
  }
}

resource "google_project_iam_member" "project-sinks-binding" {
  for_each = local.sink_bindings["project"]
  project  = each.value.destination
  role     = "roles/logging.logWriter"
  member   = google_logging_organization_sink.sink[each.key].writer_identity
}

resource "google_logging_organization_exclusion" "logging-exclusion" {
  for_each    = var.logging_exclusions
  name        = each.key
  org_id      = local.organization_id_numeric
  description = "${each.key} (Terraform-managed)."
  filter      = each.value
}
