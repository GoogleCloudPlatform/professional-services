# Copyright 2023 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

resource "google_cloudbuild_trigger" "containerize_app" {
  # https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloudbuild_trigger
  project     = data.google_project.cicd.name
  name        = "containerize-${var.application_name}"
  description = "Containerize ${var.application_name} latest"
  tags        = ["app", "build"]
  location    = var.region

  substitutions = {
    _AR_LOC      = var.cicd_ar_docker_loc
    _AR_REPO     = var.cicd_ar_docker_name
    _APPLICATION = var.application_name
  }

  # Github Repo example
  source_to_build {
    uri       = "https://github-user-org-name/repository-name"
    ref       = "refs/heads/main"
    repo_type = "GITHUB"
  }

  git_file_source {
    path      = "cloudbuild/containerize.yaml"
    uri       = "https://github-user-org-name/repository-name"
    revision  = "refs/heads/main"
    repo_type = "GITHUB"
  }
}
