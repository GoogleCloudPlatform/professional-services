// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "_%@"
}

resource "google_secret_manager_secret" "secret" {
  project   = data.google_project.project.project_id
  secret_id = "ipam-db-password"
  replication {
    automatic = true
  }

  depends_on = [
    google_project_service.project
  ]
}

resource "google_secret_manager_secret_version" "secret-version-data" {
  secret      = google_secret_manager_secret.secret.name
  secret_data = random_password.db_password.result
}

resource "google_secret_manager_secret_iam_member" "secret-access" {
  project    = data.google_project.project.project_id
  secret_id  = google_secret_manager_secret.secret.id
  role       = "roles/secretmanager.secretAccessor"
  member     = "serviceAccount:${google_service_account.autopilot.email}"
  depends_on = [google_secret_manager_secret.secret]
}

resource "google_sql_database_instance" "instance" {
  name             = "ipam-mysql"
  database_version = "MYSQL_8_0"
  region           = var.region
  project          = data.google_project.project.project_id

  settings {
    tier = "db-f1-micro"
  }

  deletion_protection = "true"
}

resource "google_sql_database" "database" {
  name     = "ipam"
  project  = data.google_project.project.project_id
  instance = google_sql_database_instance.instance.name
}

resource "google_sql_user" "user" {
  name     = "ipam"
  project  = data.google_project.project.project_id
  instance = google_sql_database_instance.instance.name
  password = random_password.db_password.result
}