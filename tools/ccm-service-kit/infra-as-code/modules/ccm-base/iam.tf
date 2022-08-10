resource "google_project_iam_binding" "environmentAndStorageObjectAdmin" {
    project = var.project_id
    role = "roles/composer.environmentAndStorageObjectAdmin"

    members = [
    "serviceAccount:${google_service_account.service_account.email}",
    ]
}

resource "google_project_iam_binding" "serviceAccountUser" {
    project = var.project_id
    role = "roles/iam.serviceAccountUser"

    members = [
    "serviceAccount:${google_service_account.service_account.email}",
    ]

}

resource "google_project_iam_binding" "composerAdmin" {
    project = var.project_id
    role = "roles/composer.admin"

    members = [
    "serviceAccount:${google_service_account.service_account.email}",
    ]

}

resource "google_project_iam_binding" "serviceAgent2" {
    project = var.project_id
    role = "roles/composer.ServiceAgentV2Ext"

    members = [
    "serviceAccount:service-${var.project_number}@cloudcomposer-accounts.iam.gserviceaccount.com",
    ]

}

