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

resource "google_sourcerepo_repository" "default" {
  project = var.project_id
  name    = var.name
}

resource "google_cloudbuild_trigger" "default" {
  for_each        = coalesce(var.triggers, {})
  project         = var.project_id
  name            = each.key
  filename        = each.value.filename
  included_files  = each.value.included_files
  service_account = each.value.service_account
  substitutions   = each.value.substitutions
  trigger_template {
    project_id  = try(each.value.template.project_id, var.project_id)
    branch_name = try(each.value.template.branch_name, null)
    repo_name   = google_sourcerepo_repository.default.name
    tag_name    = try(each.value.template.tag_name, null)
  }
}
