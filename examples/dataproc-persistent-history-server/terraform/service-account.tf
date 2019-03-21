resource "google_service_account" "history-server-account" {
  account_id = "history-server-account"
}

resource "google_project_iam_member" "" {
  project = "${var.project}"
  role    = "roles/dataproc.worker"

  members = [
    "serviceAccount:history-server-account@${var.project}.iam.gserviceaccount.com",
  ]
}
