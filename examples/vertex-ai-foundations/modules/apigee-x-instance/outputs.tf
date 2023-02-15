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
 * limitations under the License.
 * See the License for the specific language governing permissions and
 */

output "endpoint" {
  description = "Internal endpoint of the Apigee instance."
  value       = google_apigee_instance.apigee_instance.host
}

output "id" {
  description = "Apigee instance ID."
  value       = google_apigee_instance.apigee_instance.id
}

output "instance" {
  description = "Apigee instance."
  value       = google_apigee_instance.apigee_instance
}

output "port" {
  description = "Port number of the internal endpoint of the Apigee instance."
  value       = google_apigee_instance.apigee_instance.port
}

output "service_attachment" {
  description = "Resource name of the service attachment created for this Apigee instance."
  value       = google_apigee_instance.apigee_instance.service_attachment
}
