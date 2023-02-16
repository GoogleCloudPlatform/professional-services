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

terraform {
  # Pull the terraform configuration from the local file system. Terragrunt will make a copy of the source folder in the
  # Terragrunt working directory (typically `.terragrunt-cache`).
  source = "../..//src"

  # Files to include from the Terraform src directory
  include_in_copy = [
    "main.tf",
    "variables.tf",
    "outputs.tf",
    "provider.tf"
  ]
}

# Accepts "path_relative_to_include()" from root, and sets GCS bucket path to
# .state file
include "root" {
  path = find_in_parent_folders()
}

# Sets default value for all projects in this category
inputs = {
    defaults_file = "defaults.yaml"
}