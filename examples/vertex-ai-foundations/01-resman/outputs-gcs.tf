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

# tfdoc:file:description Output files persistence to automation GCS bucket.

resource "google_storage_bucket_object" "providers" {
  for_each = local.providers
  bucket   = var.automation.outputs_bucket
  name     = "providers/${each.key}-providers.tf"
  content  = each.value
}

resource "google_storage_bucket_object" "tfvars" {
  bucket  = var.automation.outputs_bucket
  name    = "tfvars/01-resman.auto.tfvars.json"
  content = jsonencode(local.tfvars)
}

resource "google_storage_bucket_object" "workflows" {
  for_each = local.cicd_workflows
  bucket   = var.automation.outputs_bucket
  name     = "workflows/${replace(each.key, "_", "-")}-workflow.yaml"
  content  = each.value
}
