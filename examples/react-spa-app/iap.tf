# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0(the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

locals {
  iap_backends = var.global_lb == true ? [for name in module.xlb[""].backend_service_names :
    format("projects/%d/iap_web/compute/services/%s", module.project.number, name)
  ] : []
  iap_regional_backends = var.regional_lb == true ? [for name in module.xlb-regional[""].backend_service_names :
    format("projects/%d/iap_web/compute-%s/services/%s", module.project.number, var.region, name)
  ] : []
}

resource "google_iap_brand" "project-brand" {
  for_each          = toset(var.iap_config.enabled == true && var.iap_config.brand == null ? [""] : [])
  support_email     = var.iap_config.support_email
  application_title = "Cloud IAP protected React app"
  project           = module.project.project_id
}

resource "google_iap_client" "project-client" {
  for_each     = toset(var.iap_config.enabled == true ? [""] : [])
  display_name = "React App"
  brand        = var.iap_config.brand == null ? google_iap_brand.project-brand[""].name : format("projects/%d/brands/%s", module.project.number, var.iap_config.brand)
}

resource "google_iap_settings" "iap_settings" {
  for_each = toset(var.iap_config.enabled == true ? concat(local.iap_backends, local.iap_regional_backends) : [])
  name     = each.key

  access_settings {
    # Allow OPTIONS to backend to preflight CORS
    cors_settings {
      allow_http_options = true
    }
  }
  application_settings {
    # Share cookies between frontend and backend
    cookie_domain = trimsuffix(module.dns[""].domain, ".")
  }
}
