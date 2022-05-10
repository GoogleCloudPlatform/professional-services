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
  gke_agent_sa      = "service-${module.project-composer.project_number}@container-engine-robot.iam.gserviceaccount.com"
  cloud_services_sa = "${module.project-composer.project_number}@cloudservices.gserviceaccount.com"
  composer_agent_sa = "service-${module.project-composer.project_number}@cloudcomposer-accounts.iam.gserviceaccount.com"
}

/**************************************************
 Add permission for Creating Composer in shared VPC
***************************************************/
resource "google_project_iam_member" "iam_member_network_user_gke_agent" {
  project = module.project-networking.project_id
  role    = "roles/compute.networkUser"
  member  = "serviceAccount:${local.gke_agent_sa}"
}

resource "google_project_iam_member" "iam_member_network_user_gke_cloud_services" {
  project = module.project-networking.project_id
  role    = "roles/compute.networkUser"
  member  = "serviceAccount:${local.cloud_services_sa}"
}


resource "google_project_iam_member" "iam_member_network_user_composer_agent" {
  project = module.project-networking.project_id
  role    = "roles/compute.networkUser"
  member  = "serviceAccount:${local.composer_agent_sa}"
}

resource "google_project_iam_member" "iam_member_security_admin_gke_agent" {
  project = module.project-networking.project_id
  role    = "roles/compute.securityAdmin"
  member  = "serviceAccount:${local.gke_agent_sa}"
}

resource "google_project_iam_member" "iam_member_host_service_agent_gke_agent" {
  project = module.project-networking.project_id
  role    = "roles/container.hostServiceAgentUser"
  member  = "serviceAccount:${local.gke_agent_sa}"
}

# For private environments add roles/composer.sharedVpcAgent
resource "google_project_iam_member" "iam_member_shared_vpc_composer_agent" {
  project = module.project-networking.project_id
  role    = "roles/composer.sharedVpcAgent"
  member  = "serviceAccount:${local.composer_agent_sa}"
}

# For v2 environments add roles/composer.ServiceAgentV2Ext
resource "google_project_iam_member" "iam_member_v2ext_composer_agent" {
  project = module.project-networking.project_id
  role    = "roles/composer.ServiceAgentV2Ext"
  member  = "serviceAccount:${local.composer_agent_sa}"
}
