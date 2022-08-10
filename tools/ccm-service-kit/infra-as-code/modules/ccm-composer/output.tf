output "composer_bucket" {
    value = google_composer_environment.composer_intance.config.0.dag_gcs_prefix
}