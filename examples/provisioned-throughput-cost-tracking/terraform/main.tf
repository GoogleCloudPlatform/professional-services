# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

locals {
  apis        = ["aiplatform.googleapis.com", "bigquery.googleapis.com", "logging.googleapis.com"]
  api_host    = var.location == "global" ? "aiplatform.googleapis.com" : "${var.location}-aiplatform.googleapis.com"
  expiry_ms   = var.log_retention_days > 0 ? var.log_retention_days * 24 * 60 * 60 * 1000 : null
  impersonate = { for pair in setproduct(var.teams, var.caller_members) : "${pair[0]}|${pair[1]}" => { team = pair[0], member = pair[1] } }
}

resource "google_project_service" "apis" {
  for_each           = toset(local.apis)
  service            = each.value
  disable_on_destroy = false
}

# One identity per team, so every request can be traced to the team that made it.
resource "google_service_account" "team" {
  for_each     = toset(var.teams)
  account_id   = "${each.value}-sa"
  display_name = "${each.value}-sa"
  depends_on   = [google_project_service.apis]
}

resource "google_project_iam_member" "vertex_user" {
  for_each = google_service_account.team
  project  = var.project_id
  role     = "roles/aiplatform.user"
  member   = each.value.member
}

resource "google_service_account_iam_member" "caller_impersonation" {
  for_each           = local.impersonate
  service_account_id = google_service_account.team[each.value.team].name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = each.value.member
}

resource "google_bigquery_dataset" "usage" {
  dataset_id                      = var.dataset_id
  location                        = var.bq_location
  description                     = "Gemini inference request metadata log (one row per request) for per-team cost attribution."
  default_table_expiration_ms     = local.expiry_ms
  default_partition_expiration_ms = local.expiry_ms
  delete_contents_on_destroy      = var.delete_contents_on_destroy
  depends_on                      = [google_project_service.apis]
}

# Turns on inference request metadata logs for every model in the project. Each entry records the
# calling account, labels, traffic type, token counts and Provisioned Throughput burndown, never prompts.
# There is no dedicated Terraform resource yet, so this calls the REST API.
resource "terraform_data" "metadata_logging" {
  count            = var.enable_metadata_logging ? 1 : 0
  triggers_replace = [var.project_id]
  provisioner "local-exec" {
    command = <<-EOT
      curl -sS --fail-with-body -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" \
        -H "Content-Type: application/json" \
        "https://aiplatform.googleapis.com/v1beta1/projects/${var.project_id}:setPublisherModelConfig" \
        -d '{"publisherModelConfig": {"inferenceEventLoggingConfig": {"state": "ENABLED"}}, "updateMask": "inferenceEventLoggingConfig"}'
    EOT
  }
  depends_on = [google_project_service.apis]
}

resource "google_logging_project_sink" "usage" {
  name        = var.sink_name
  destination = "bigquery.googleapis.com/projects/${var.project_id}/datasets/${google_bigquery_dataset.usage.dataset_id}"
  filter      = "logName=\"projects/${var.project_id}/logs/aiplatform.googleapis.com%2Finference_request\""
  bigquery_options { use_partitioned_tables = true }
  unique_writer_identity = true
}

resource "google_bigquery_dataset_iam_member" "sink_writer" {
  dataset_id = google_bigquery_dataset.usage.dataset_id
  role       = "roles/bigquery.dataEditor"
  member     = google_logging_project_sink.usage.writer_identity
}

# Optional: full prompt and response logging per model. Not needed for cost tracking.
resource "terraform_data" "prompt_logging" {
  for_each         = var.enable_prompt_logging ? toset(var.prompt_logged_models) : toset([])
  triggers_replace = [var.project_id, var.location, each.value, var.dataset_id, var.prompt_log_table]
  provisioner "local-exec" {
    command = <<-EOT
      curl -sS --fail-with-body -X POST -H "Authorization: Bearer $(gcloud auth print-access-token)" \
        -H "Content-Type: application/json" \
        "https://${local.api_host}/v1beta1/projects/${var.project_id}/locations/${var.location}/publishers/google/models/${each.value}:setPublisherModelConfig" \
        -d '{"publisherModelConfig": {"loggingConfig": {"enabled": true, "samplingRate": 1.0, "bigqueryDestination": {"outputUri": "bq://${var.project_id}.${var.dataset_id}.${var.prompt_log_table}"}}}, "updateMask": "loggingConfig"}'
    EOT
  }
  depends_on = [google_bigquery_dataset.usage]
}
