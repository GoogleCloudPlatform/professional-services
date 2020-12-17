# Create service accounts used for connecting the GKE clusters with an Anthos Environ
# https://cloud.google.com/anthos/multicluster-management/connect/registering-a-cluster
# These service accounts are used in the register_cluster function in scripts/main.sh
resource "google_service_account" "cluster-with-environ-cluster3" {
  project      = var.project_id
  account_id   = "${var.prefix}-cluster3-connect"
  display_name = "${var.prefix}-cluster3-connect"
}

resource "google_service_account" "cluster-with-environ-cluster4" {
  project      = var.project_id
  account_id   = "${var.prefix}-cluster4-connect"
  display_name = "${var.prefix}-cluster4-connect"
}

resource "google_project_iam_binding" "project" {
  project = var.project_id
  role    = "roles/gkehub.connect"

  members = [
    "serviceAccount:${google_service_account.cluster-with-environ-cluster3.email}",
    "serviceAccount:${google_service_account.cluster-with-environ-cluster4.email}",
  ]
}
