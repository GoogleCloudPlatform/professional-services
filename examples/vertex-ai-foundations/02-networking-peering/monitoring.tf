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

# tfdoc:file:description Network monitoring dashboards.

locals {
  dashboard_path  = "${var.data_dir}/dashboards"
  dashboard_files = fileset(local.dashboard_path, "*.json")
  dashboards = {
    for filename in local.dashboard_files :
    filename => "${local.dashboard_path}/${filename}"
  }
}

resource "google_monitoring_dashboard" "dashboard" {
  for_each       = local.dashboards
  project        = module.common-project.project_id
  dashboard_json = file(each.value)
}
