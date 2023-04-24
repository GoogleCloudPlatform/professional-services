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

module "service-accounts" {
  source     = "../../modules/iam-service-account"
  for_each   = var.service_accounts
  name       = each.key
  project_id = var.project_id
  iam_project_roles = {
    (var.project_id) = each.value.project_roles
  }
  iam_sa_roles = try(each.value.sa_roles, null)
  iam_storage_roles = try(each.value.storage_roles,null)
}

module "bucket" {
    source         = "../../modules/gcs"
    project_id     = var.project_id
    prefix         = var.bucket.prefix
    name           = var.bucket.name
    iam            = var.bucket.iam
    encryption_key = try(var.bucket.encryption_key, null)
}