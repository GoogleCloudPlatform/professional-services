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

output "cloud_run_service" {
  description = "CloudRun service URL"
  value       = module.cloud_run.service.status[0].url
  sensitive   = true
}

output "cloudsql_password" {
  description = "CloudSQL password"
  value       = var.cloudsql_password == null ? module.cloudsql.user_passwords[local.cloudsql_conf.user] : var.cloudsql_password
  sensitive   = true
}

output "wp_password" {
  description = "Wordpress user password"
  value       = local.wp_pass
  sensitive   = true
}

output "wp_user" {
  description = "Wordpress username"
  value       = local.wp_user
}
