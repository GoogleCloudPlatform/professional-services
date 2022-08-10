resource "google_storage_bucket" "main" {
  name                        = "ccm-${random_string.random_id.result}"
  storage_class               = "REGIONAL" 
  project                     = var.project_id
  location                    = var.region
  uniform_bucket_level_access = true
}

resource "google_storage_bucket" "composer-bucket" {
  name                        = "ccm-composer-${random_string.random_id.result}"
  storage_class               = "REGIONAL" 
  project                     = var.project_id
  location                    = var.region
  uniform_bucket_level_access = true
}