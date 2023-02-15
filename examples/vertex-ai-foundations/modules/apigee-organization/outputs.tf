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

output "envs" {
  description = "Apigee Environments."
  value       = google_apigee_environment.apigee_env
}

output "org" {
  description = "Apigee Organization."
  value       = google_apigee_organization.apigee_org
}

output "org_ca_certificate" {
  description = "Apigee organization CA certificate."
  value       = google_apigee_organization.apigee_org.ca_certificate
}

output "org_id" {
  description = "Apigee Organization ID."
  value       = google_apigee_organization.apigee_org.id
}

output "subscription_type" {
  description = "Apigee subscription type."
  value       = google_apigee_organization.apigee_org.subscription_type
}
