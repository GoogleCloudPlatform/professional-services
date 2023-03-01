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

# Reads values from root.yaml
locals {
  vars = yamldecode(file(find_in_parent_folders("root.yaml", "root.yaml")))
}

# Set inputs from definitions in root.yaml 
inputs = local.vars

/** Defines remote state for each subdirectory with a .terragrunt.hcl file
 setting a relative path. */
remote_state {
  backend = "gcs"
  config = {
    bucket   = local.vars.gcs_bucket
    prefix   = path_relative_to_include()
    project  = local.vars.root_project
    location = local.vars.region
  }
}