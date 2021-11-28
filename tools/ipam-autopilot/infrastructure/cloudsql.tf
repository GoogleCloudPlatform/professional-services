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