resource "google_storage_bucket" "bucket" {
  name          = "test-bucket"
  location      = "EU"
  force_destroy = true
}