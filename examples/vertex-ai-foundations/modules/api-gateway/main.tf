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
  service_account_email = (
    var.service_account_create
    ? (
      length(google_service_account.service_account) > 0
      ? google_service_account.service_account[0].email
      : null
    )
    : var.service_account_email
  )
}

resource "google_api_gateway_api" "api" {
  provider     = google-beta
  project      = var.project_id
  api_id       = var.api_id
  display_name = var.api_id
  labels       = var.labels
}

resource "google_service_account" "service_account" {
  count        = var.service_account_create ? 1 : 0
  project      = var.project_id
  account_id   = "sa-api-cfg-${google_api_gateway_api.api.api_id}"
  display_name = "Service account to create API configs for ${google_api_gateway_api.api.api_id} API"
}

resource "google_api_gateway_api_config" "api_config" {
  provider      = google-beta
  project       = google_api_gateway_api.api.project
  api           = google_api_gateway_api.api.api_id
  api_config_id = "api-cfg-${google_api_gateway_api.api.api_id}-${md5(var.spec)}"
  display_name  = "api-cfg-${google_api_gateway_api.api.api_id}-${md5(var.spec)}"
  openapi_documents {
    document {
      path     = "spec.yaml"
      contents = base64encode(var.spec)
    }
  }
  dynamic "gateway_config" {
    for_each = local.service_account_email == null ? [] : [""]
    content {
      backend_config {
        google_service_account = local.service_account_email
      }
    }
  }
  lifecycle {
    create_before_destroy = true
  }
}

resource "google_api_gateway_gateway" "gateway" {
  provider     = google-beta
  project      = google_api_gateway_api_config.api_config.project
  api_config   = google_api_gateway_api_config.api_config.id
  gateway_id   = "gw-${google_api_gateway_api.api.api_id}"
  display_name = "gw-${google_api_gateway_api.api.api_id}"
  region       = var.region
  lifecycle {
    create_before_destroy = true
  }
}

resource "google_project_service" "service" {
  project                    = google_api_gateway_gateway.gateway.project
  service                    = google_api_gateway_api.api.managed_service
  disable_on_destroy         = true
  disable_dependent_services = true
}

resource "google_api_gateway_api_iam_binding" "api_iam_bindings" {
  for_each = coalesce(var.iam, {})
  provider = google-beta
  project  = google_api_gateway_api.api.project
  api      = google_api_gateway_api.api.api_id
  role     = each.key
  members  = each.value
}

resource "google_api_gateway_api_config_iam_binding" "api_config_iam_bindings" {
  for_each   = coalesce(var.iam, {})
  provider   = google-beta
  project    = google_api_gateway_api_config.api_config.project
  api        = google_api_gateway_api.api.api_id
  api_config = google_api_gateway_api_config.api_config.api_config_id
  role       = each.key
  members    = each.value
}

resource "google_api_gateway_gateway_iam_binding" "gateway_iam_bindings" {
  for_each = coalesce(var.iam, {})
  provider = google-beta
  project  = google_api_gateway_gateway.gateway.project
  gateway  = google_api_gateway_gateway.gateway.gateway_id
  region   = var.region
  role     = each.key
  members  = each.value
}
