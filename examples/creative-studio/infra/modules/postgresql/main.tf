resource "random_id" "db_name_suffix" {
  byte_length = 4
}

resource "google_sql_database_instance" "default" {
  name             = "creative-studio-db-${random_id.db_name_suffix.hex}"
  database_version = "POSTGRES_18" # Latest stable version
  region           = var.region
  project          = var.project_id

  settings {
    tier = "db-perf-optimized-N-2"
    
    # Enable IAM Authentication for better security (optional but recommended)
    database_flags {
      name  = "cloudsql.iam_authentication"
      value = "on"
    }

    ip_configuration {
      ipv4_enabled = true # Easy connectivity from Cloud Run without VPC peering complexity
    }
  }
  
  deletion_protection = false # Set to true for production
}

resource "google_sql_database" "default" {
  name     = var.db_name
  instance = google_sql_database_instance.default.name
  project  = var.project_id
}

resource "google_sql_user" "default" {
  name     = var.db_user
  instance = google_sql_database_instance.default.name
  password = var.db_password
  project  = var.project_id
}
