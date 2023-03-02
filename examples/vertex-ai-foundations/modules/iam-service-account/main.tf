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
  # https://github.com/hashicorp/terraform/issues/22405#issuecomment-591917758
  key = try(
    var.generate_key
    ? google_service_account_key.key["1"]
    : map("", null)
  , {})
  prefix                = var.prefix != null ? "${var.prefix}-" : ""
  resource_email_static = "${local.prefix}${var.name}@${var.project_id}.iam.gserviceaccount.com"
  resource_iam_email = (
    local.service_account != null
    ? "serviceAccount:${local.service_account.email}"
    : local.resource_iam_email_static
  )
  resource_iam_email_static = "serviceAccount:${local.resource_email_static}"
  service_account = (
    var.service_account_create
    ? try(google_service_account.service_account.0, null)
    : try(data.google_service_account.service_account.0, null)
  )
  service_account_credential_templates = {
    for file, _ in local.public_keys_data : file => jsonencode(
      {
        type : "service_account",
        project_id : var.project_id,
        private_key_id : split("/", google_service_account_key.upload_key[file].id)[5]
        private_key : "REPLACE_ME_WITH_PRIVATE_KEY_DATA"
        client_email : local.resource_email_static
        client_id : local.service_account.unique_id,
        auth_uri : "https://accounts.google.com/o/oauth2/auth",
        token_uri : "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url : "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url : "https://www.googleapis.com/robot/v1/metadata/x509/${urlencode(local.resource_email_static)}"
      }
    )
  }
  public_keys_data = (
    var.public_keys_directory != ""
    ? {
      for file in fileset("${path.root}/${var.public_keys_directory}", "*.pem")
    : file => filebase64("${path.root}/${var.public_keys_directory}/${file}") }
    : {}
  )
}


data "google_service_account" "service_account" {
  count      = var.service_account_create ? 0 : 1
  project    = var.project_id
  account_id = "${local.prefix}${var.name}"
}

resource "google_service_account" "service_account" {
  count        = var.service_account_create ? 1 : 0
  project      = var.project_id
  account_id   = "${local.prefix}${var.name}"
  display_name = var.display_name
  description  = var.description
}

resource "google_service_account_key" "key" {
  for_each           = var.generate_key ? { 1 = 1 } : {}
  service_account_id = local.service_account.email
}

resource "google_service_account_key" "upload_key" {
  for_each           = local.public_keys_data
  service_account_id = local.service_account.email
  public_key_data    = each.value
}
