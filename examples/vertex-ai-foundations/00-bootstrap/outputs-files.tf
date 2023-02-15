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

# tfdoc:file:description Output files persistence to local filesystem.

resource "local_file" "providers" {
  for_each        = var.outputs_location == null ? {} : local.providers
  file_permission = "0644"
  filename        = "${pathexpand(var.outputs_location)}/providers/${each.key}-providers.tf"
  content         = each.value
}

resource "local_file" "tfvars" {
  for_each        = var.outputs_location == null ? {} : { 1 = 1 }
  file_permission = "0644"
  filename        = "${pathexpand(var.outputs_location)}/tfvars/00-bootstrap.auto.tfvars.json"
  content         = jsonencode(local.tfvars)
}

resource "local_file" "tfvars_globals" {
  for_each        = var.outputs_location == null ? {} : { 1 = 1 }
  file_permission = "0644"
  filename        = "${pathexpand(var.outputs_location)}/tfvars/globals.auto.tfvars.json"
  content         = jsonencode(local.tfvars_globals)
}

resource "local_file" "workflows" {
  for_each        = local.cicd_workflows
  file_permission = "0644"
  filename        = "${pathexpand(var.outputs_location)}/workflows/${each.key}-workflow.yaml"
  content         = each.value
}
