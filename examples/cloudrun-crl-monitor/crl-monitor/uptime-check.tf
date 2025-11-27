/**
 * Copyright 2025 Google LLC
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
  url_no_scheme = replace(var.target_url, "/^https?:///", "")
  host_port     = split("/", local.url_no_scheme)[0]
  host          = split(":", local.host_port)[0]
  path_raw      = substr(local.url_no_scheme, length(local.host_port), -1)
  path          = local.path_raw != "" ? local.path_raw : "/"
  use_ssl       = startswith(var.target_url, "https://")
  port          = length(split(":", local.host_port)) > 1 ? tonumber(split(":", local.host_port)[1]) : (local.use_ssl ? 443 : 80)
}

resource "google_monitoring_uptime_check_config" "public_internet_http_check" {
  display_name = "Public Internet HTTP Uptime Check - ${var.name}"
  project      = var.project_id
  timeout      = "10s"
  period       = "60s"

  http_check {
    path    = local.path
    port    = local.port
    use_ssl = local.use_ssl
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      host = local.host
    }
  }
}
