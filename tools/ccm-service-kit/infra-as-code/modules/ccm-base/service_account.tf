resource "google_service_account" "service_account" {
    project = var.project_id
    account_id   = "ccm-worker-sa"
    display_name = "ccm-worker-sa"
}