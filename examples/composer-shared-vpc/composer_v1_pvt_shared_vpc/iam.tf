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

data "google_project" "project" {
  project_id = var.project_id
}

# Composer Worker SA
resource "google_service_account" "composer_worker_sa" {
  count        = var.composer_service_account_create ? 1 : 0
  project      = var.project_id
  account_id   = "composer-worker-sa"
  display_name = "Service account for composer workers."
}

resource "google_project_iam_member" "iam_member_composer_worker_roles" {
  for_each = { for role in var.composer_sa_permissions : role => role }
  project  = var.project_id
  role     = each.key
  member   = "serviceAccount:${local.composer_worker_sa_email}"
}

/**************************************************
 Add permission for Creating Composer in shared VPC
***************************************************/
resource "google_project_iam_member" "iam_member_gke_agent_roles" {
  for_each = { for role in local.gke_agents_permissions : role => role }
  project  = var.network_project_id
  role     = each.value
  member   = "serviceAccount:${local.gke_agent_sa}"
}

resource "google_project_iam_member" "iam_member_gke_cloud_services_roles" {
  for_each = { for role in local.cloudservices_sa_permissions : role => role }
  project  = var.network_project_id
  role     = each.value
  member   = "serviceAccount:${local.cloud_services_sa}"
}

resource "google_project_iam_member" "iam_member_composer_agent_roles" {
  for_each = { for role in local.composer_agents_permissions : role => role }
  project  = var.network_project_id
  role     = each.value
  member   = "serviceAccount:${local.composer_agent_sa}"
}