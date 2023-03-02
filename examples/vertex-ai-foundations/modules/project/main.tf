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
  descriptive_name = (
    var.descriptive_name != null ? var.descriptive_name : "${local.prefix}${var.name}"
  )
  parent_type = var.parent == null ? null : split("/", var.parent)[0]
  parent_id   = var.parent == null ? null : split("/", var.parent)[1]
  prefix      = var.prefix == null ? "" : "${var.prefix}-"
  project = (
    var.project_create ?
    {
      project_id = try(google_project.project.0.project_id, null)
      number     = try(google_project.project.0.number, null)
      name       = try(google_project.project.0.name, null)
    }
    : {
      project_id = "${local.prefix}${var.name}"
      number     = try(data.google_project.project.0.number, null)
      name       = try(data.google_project.project.0.name, null)
    }
  )
}

data "google_project" "project" {
  count      = var.project_create ? 0 : 1
  project_id = "${local.prefix}${var.name}"
}

resource "google_project" "project" {
  count               = var.project_create ? 1 : 0
  org_id              = local.parent_type == "organizations" ? local.parent_id : null
  folder_id           = local.parent_type == "folders" ? local.parent_id : null
  project_id          = "${local.prefix}${var.name}"
  name                = local.descriptive_name
  billing_account     = var.billing_account
  auto_create_network = var.auto_create_network
  labels              = var.labels
  skip_delete         = var.skip_delete
}

resource "google_project_service" "project_services" {
  for_each                   = toset(var.services)
  project                    = local.project.project_id
  service                    = each.value
  disable_on_destroy         = var.service_config.disable_on_destroy
  disable_dependent_services = var.service_config.disable_dependent_services
}

resource "google_compute_project_metadata_item" "oslogin_meta" {
  count   = var.oslogin ? 1 : 0
  project = local.project.project_id
  key     = "enable-oslogin"
  value   = "TRUE"
  # depend on services or it will fail on destroy
  depends_on = [google_project_service.project_services]
}

resource "google_resource_manager_lien" "lien" {
  count        = var.lien_reason != "" ? 1 : 0
  parent       = "projects/${local.project.number}"
  restrictions = ["resourcemanager.projects.delete"]
  origin       = "created-by-terraform"
  reason       = var.lien_reason
}

resource "google_essential_contacts_contact" "contact" {
  provider                            = google-beta
  for_each                            = var.contacts
  parent                              = "projects/${local.project.project_id}"
  email                               = each.key
  language_tag                        = "en"
  notification_category_subscriptions = each.value
}

resource "google_monitoring_monitored_project" "primary" {
  provider      = google-beta
  for_each      = toset(var.metric_scopes)
  metrics_scope = each.value
  name          = local.project.project_id
}
