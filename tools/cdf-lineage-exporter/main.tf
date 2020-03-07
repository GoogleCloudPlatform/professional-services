resource "google_storage_bucket" "cloud_functions_archives" {
  name     = var.cloud_functions_source_bucket
  project  = var.project
  location = var.region
}

resource "google_storage_bucket" "lineage_export" {
  name     = var.lineage_export_bucket
  project  = var.project
  location = var.region
}

resource "google_storage_bucket_object" "cdap_lineage_exporter_archive" {
  name   = "cdap_lineage_export.zip"
  bucket = google_storage_bucket.cloud_functions_archives.name
  source = "${path.module}/cdap_lineage_export.zip"
}


resource "google_cloudfunctions_function" "cdap_lineage_export" {
  name        = "cdap-lineage-gcs-export"
  project     = var.project
  region      = var.region
  description = "Export CDAP Lineage to GCS"
  runtime     = "python37"

  available_memory_mb   = 256
  source_archive_bucket = google_storage_bucket.cloud_functions_archives.name
  source_archive_object = google_storage_bucket_object.cdap_lineage_exporter_archive.name
  service_account_email = google_service_account.cdap_lineage_exporter.email
  trigger_http          = true
  entry_point           = "handle_http"
}


resource "google_service_account" "cdap_lineage_exporter" {
  project    = var.project
  account_id = "cdap-lineage-export"
}

resource "google_project_iam_member" "lineage_datafusion_viewer" {
  project = var.project
  role    = "roles/datafusion.viewer"
  member  = "serviceAccount:${google_service_account.cdap_lineage_exporter.email}"
}

resource "google_storage_bucket_iam_member" "editor" {
  bucket = google_storage_bucket.lineage_export.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.cdap_lineage_exporter.email}"
}

# Allow Cloud Function SA to act as the SA for this function
resource "google_service_account_iam_member" "cloud_functions_act_as_exporter" {
  service_account_id = google_service_account.cdap_lineage_exporter.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${var.project}@appspot.gserviceaccount.com"
}

# IAM entry for all users to invoke the function.
# This is likely too permissive for production as this function allows invokers to
# specify any gcs target bucket
resource "google_cloudfunctions_function_iam_member" "invoker" {
  project        = google_cloudfunctions_function.cdap_lineage_export.project
  region         = google_cloudfunctions_function.cdap_lineage_export.region
  cloud_function = google_cloudfunctions_function.cdap_lineage_export.name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"
}
