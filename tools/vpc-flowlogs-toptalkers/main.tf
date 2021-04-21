/**
 * Copyright 2021 Google LLC
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

module "log_export" {
  for_each               = var.vpc_project_ids
  source                 = "terraform-google-modules/log-export/google"
  destination_uri        = module.destination.destination_uri
  filter                 = "logName=\"projects/${each.value}/logs/compute.googleapis.com%2Fvpc_flows\" jsonPayload.reporter=\"SRC\""
  log_sink_name          = "toptalkers-sink"
  parent_resource_id     = each.value
  parent_resource_type   = "project"
  unique_writer_identity = true
}

module "destination" {
  source                   = "terraform-google-modules/log-export/google//modules/bigquery"
  project_id               = var.logs_project_id
  dataset_name             = var.dataset_name
  location                 = var.location
  log_sink_writer_identity = module.log_export[keys(module.log_export)[0]].writer_identity
}

# copied from terraform-google-modules/log-export/google//modules/bigquery
resource "google_project_iam_member" "bigquery_sink_member" {
  for_each = module.log_export
  project  = var.logs_project_id
  role     = "roles/bigquery.dataEditor"
  member   = each.value.writer_identity
}
