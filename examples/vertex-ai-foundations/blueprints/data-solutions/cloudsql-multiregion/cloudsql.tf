# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

module "db" {
  source              = "../../../modules/cloudsql-instance"
  project_id          = module.project.project_id
  availability_type   = var.sql_configuration.availability_type
  encryption_key_name = var.service_encryption_keys != null ? try(var.service_encryption_keys[var.regions.primary], null) : null
  network             = local.vpc_self_link
  name                = "${var.prefix}-db"
  region              = var.regions.primary
  database_version    = var.sql_configuration.database_version
  tier                = var.sql_configuration.tier
  flags = {
    "cloudsql.iam_authentication" = "on"
  }
  replicas = {
    for k, v in var.regions :
    k => {
      region              = v,
      encryption_key_name = var.service_encryption_keys != null ? try(var.service_encryption_keys[v], null) : null
    } if k != "primary"
  }
  databases = [var.postgres_database]
  users = {
    postgres = var.postgres_user_password
  }
}

resource "google_sql_user" "users" {
  for_each = toset(var.data_eng_principals)
  project  = module.project.project_id
  name     = each.value
  instance = module.db.name
  type     = "CLOUD_IAM_USER"
}

resource "google_sql_user" "service-account" {
  for_each = toset(var.data_eng_principals)
  project  = module.project.project_id
  # Omit the .gserviceaccount.com suffix in the email
  name     = regex("(.+)(.gserviceaccount)", module.service-account-sql.email)[0]
  instance = module.db.name
  type     = "CLOUD_IAM_SERVICE_ACCOUNT"
}

module "service-account-sql" {
  source     = "../../../modules/iam-service-account"
  project_id = module.project.project_id
  name       = "${var.prefix}-sql"
}
