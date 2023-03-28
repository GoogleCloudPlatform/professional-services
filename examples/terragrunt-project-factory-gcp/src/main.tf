/**
 * Copyright 2023 Google LLC
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

# Combines project specific values and default values to make them available
# through project key in the project-factory invocation.
locals {
  _defaults = yamldecode(file(var.defaults_file))
  projects = {
    for f in fileset("${var.data_dir}", "**/*.yaml") :
    trimsuffix(f, ".yaml") => merge(
      yamldecode(file("${var.data_dir}/${f}")),
      local._defaults
    )
  }
}

# Module invocation to public project-factory module.
module "projects" {
  source   = "terraform-google-modules/project-factory/google"
  version  = "~> 14.1"
  for_each = local.projects

  name              = each.key
  org_id            = each.value.org_id
  billing_account   = each.value.billing_account
  random_project_id = true
  folder_id         = each.value.folder_id
}