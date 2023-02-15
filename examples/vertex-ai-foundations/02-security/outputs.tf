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

locals {
  _output_kms_keys = concat(
    flatten([
      for location, mod in module.dev-sec-kms : [
        for name, id in mod.key_ids : {
          key = "dev-${name}:${location}"
          id  = id
        }
      ]
    ]),
    flatten([
      for location, mod in module.prod-sec-kms : [
        for name, id in mod.key_ids : {
          key = "prod-${name}:${location}"
          id  = id
        }
      ]
    ])
  )
  output_kms_keys = { for k in local._output_kms_keys : k.key => k.id }
  tfvars = {
    kms_keys = local.output_kms_keys
  }
}

# generate files for subsequent stages

resource "local_file" "tfvars" {
  for_each        = var.outputs_location == null ? {} : { 1 = 1 }
  file_permission = "0644"
  filename        = "${pathexpand(var.outputs_location)}/tfvars/02-security.auto.tfvars.json"
  content         = jsonencode(local.tfvars)
}

resource "google_storage_bucket_object" "tfvars" {
  bucket  = var.automation.outputs_bucket
  name    = "tfvars/02-security.auto.tfvars.json"
  content = jsonencode(local.tfvars)
}

# outputs

output "kms_keys" {
  description = "KMS key ids."
  value       = local.output_kms_keys
}

output "stage_perimeter_projects" {
  description = "Security project numbers. They can be added to perimeter resources."
  value = {
    dev  = ["projects/${module.dev-sec-project.number}"]
    prod = ["projects/${module.prod-sec-project.number}"]
  }
}

# ready to use variable values for subsequent stages

output "tfvars" {
  description = "Terraform variable files for the following stages."
  sensitive   = true
  value       = local.tfvars
}
