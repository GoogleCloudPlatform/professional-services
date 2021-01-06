/**
 * Copyright 2020 Google LLC
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

# Grant the Host Service Agent User role to the GKE service accounts on the host project
/**
resource "google_project_iam_binding" "host-service-agent-for-gke-service-accounts" {
  project = var.project_id
  role    = "roles/container.hostServiceAgentUser"
  members = [
    "serviceAccount:service-${var.project_number}@container-engine-robot.iam.gserviceaccount.com",
  ]
}

resource "google_project_iam_custom_role" "firewall_admin" {
  project = var.project_id
  role_id = "${var.prefix}_firewall_admin"
  title   = "Firewall Admin"
  permissions = [
    "compute.firewalls.create",
    "compute.firewalls.get",
    "compute.firewalls.delete",
    "compute.firewalls.list",
    "compute.firewalls.update",
    "compute.networks.updatePolicy",
  ]
}
*/

# Add the cluster1 Kubernetes Engine Service Agent to the above custom role.
# This allows for the GKE SA to make necessary firewall updates
/**
resource "google_project_iam_member" "add_firewall_admin_to_app1_gke_service_account" {
  project = var.project_id
  role    = "projects/${var.project_id}/roles/${var.prefix}_firewall_admin"
  member  = "serviceAccount:service-${var.project_number}@container-engine-robot.iam.gserviceaccount.com"
}
*/