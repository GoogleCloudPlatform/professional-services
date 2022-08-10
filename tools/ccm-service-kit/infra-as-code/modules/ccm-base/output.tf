output "composer_bucket" {
    value = google_storage_bucket.composer-bucket.url
}

output "ccm_service_account" {
    value = google_service_account.service_account.email
}