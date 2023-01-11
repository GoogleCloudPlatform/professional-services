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

output "api" {
  description = "API."
  value       = google_api_gateway_api.api
  depends_on = [
    google_project_service.service,
    google_api_gateway_api_iam_binding.api_iam_bindings,
    google_api_gateway_api_config_iam_binding.api_config_iam_bindings,
    google_api_gateway_gateway_iam_binding.gateway_iam_bindings
  ]
}

output "api_config" {
  description = "API configs."
  value       = google_api_gateway_api_config.api_config
  depends_on = [
    google_project_service.service,
    google_api_gateway_api_iam_binding.api_iam_bindings,
    google_api_gateway_api_config_iam_binding.api_config_iam_bindings,
    google_api_gateway_gateway_iam_binding.gateway_iam_bindings
  ]
}

output "api_config_id" {
  description = "The identifiers of the API configs."
  value       = google_api_gateway_api_config.api_config.api_config_id
  depends_on = [
    google_project_service.service,
    google_api_gateway_api_iam_binding.api_iam_bindings,
    google_api_gateway_api_config_iam_binding.api_config_iam_bindings,
    google_api_gateway_gateway_iam_binding.gateway_iam_bindings
  ]
}

output "api_id" {
  description = "API identifier."
  value       = google_api_gateway_api.api.api_id
  depends_on = [
    google_project_service.service,
    google_api_gateway_api_iam_binding.api_iam_bindings,
    google_api_gateway_api_config_iam_binding.api_config_iam_bindings,
    google_api_gateway_gateway_iam_binding.gateway_iam_bindings
  ]
}

output "default_hostname" {
  description = "The default host names of the API gateway."
  value       = google_api_gateway_gateway.gateway.default_hostname
  depends_on = [
    google_project_service.service,
    google_api_gateway_api_iam_binding.api_iam_bindings,
    google_api_gateway_api_config_iam_binding.api_config_iam_bindings,
    google_api_gateway_gateway_iam_binding.gateway_iam_bindings
  ]
}

output "gateway" {
  description = "API gateways."
  value       = google_api_gateway_gateway.gateway
  depends_on = [
    google_project_service.service,
    google_api_gateway_api_iam_binding.api_iam_bindings,
    google_api_gateway_api_config_iam_binding.api_config_iam_bindings,
    google_api_gateway_gateway_iam_binding.gateway_iam_bindings
  ]
}

output "gateway_id" {
  description = "The identifiers of the API gateways."
  value       = google_api_gateway_gateway.gateway.gateway_id
  depends_on = [
    google_project_service.service,
    google_api_gateway_api_iam_binding.api_iam_bindings,
    google_api_gateway_api_config_iam_binding.api_config_iam_bindings,
    google_api_gateway_gateway_iam_binding.gateway_iam_bindings
  ]
}

output "service_account" {
  description = "Service account resource."
  value       = try(google_service_account.service_account[0], null)
}

output "service_account_email" {
  description = "The service account for creating API configs."
  value       = local.service_account_email
}

output "service_account_iam_email" {
  description = "The service account for creating API configs."
  value       = local.service_account_email == null ? null : "serviceAccount:${local.service_account_email}"
}
