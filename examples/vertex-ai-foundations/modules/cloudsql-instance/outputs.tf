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
  _all_intances = merge(
    { primary = google_sql_database_instance.primary },
    google_sql_database_instance.replicas
  )
}

output "connection_name" {
  description = "Connection name of the primary instance."
  value       = google_sql_database_instance.primary.connection_name
}

output "connection_names" {
  description = "Connection names of all instances."
  value = {
    for id, instance in local._all_intances :
    id => instance.connection_name
  }
}

output "id" {
  description = "ID of the primary instance."
  value       = google_sql_database_instance.primary.private_ip_address
}

output "ids" {
  description = "IDs of all instances."
  value = {
    for id, instance in local._all_intances :
    id => instance.id
  }
}

output "instances" {
  description = "Cloud SQL instance resources."
  value       = local._all_intances
  sensitive   = true
}

output "ip" {
  description = "IP address of the primary instance."
  value       = google_sql_database_instance.primary.private_ip_address
}

output "ips" {
  description = "IP addresses of all instances."
  value = {
    for id, instance in local._all_intances :
    id => instance.private_ip_address
  }
}

output "name" {
  description = "Name of the primary instance."
  value       = google_sql_database_instance.primary.name
}

output "names" {
  description = "Names of all instances."
  value = {
    for id, instance in local._all_intances :
    id => instance.name
  }
}

output "self_link" {
  description = "Self link of the primary instance."
  value       = google_sql_database_instance.primary.self_link
}

output "self_links" {
  description = "Self links of all instances."
  value = {
    for id, instance in local._all_intances :
    id => instance.self_link
  }
}

output "user_passwords" {
  description = "Map of containing the password of all users created through terraform."
  value = {
    for name, user in google_sql_user.users :
    name => user.password
  }
  sensitive = true
}
