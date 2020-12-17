# Grant the Host Service Agent User role to the GKE service accounts on the host project
/**
resource "google_project_iam_binding" "host-service-agent-for-gke-service-accounts" {
  project = var.project_id
  role    = "roles/container.hostServiceAgentUser"
  members = [
    "serviceAccount:service-${var.project_number}@container-engine-robot.iam.gserviceaccount.com",
  ]
}

resource "google_project_iam_custom_role" "firewall_admin" {
  project = var.project_id
  role_id = "${var.prefix}_firewall_admin"
  title   = "Firewall Admin"
  permissions = [
    "compute.firewalls.create",
    "compute.firewalls.get",
    "compute.firewalls.delete",
    "compute.firewalls.list",
    "compute.firewalls.update",
    "compute.networks.updatePolicy",
  ]
}
*/

# Add the cluster1 Kubernetes Engine Service Agent to the above custom role.
# This allows for the GKE SA to make necessary firewall updates
/**
resource "google_project_iam_member" "add_firewall_admin_to_app1_gke_service_account" {
  project = var.project_id
  role    = "projects/${var.project_id}/roles/${var.prefix}_firewall_admin"
  member  = "serviceAccount:service-${var.project_number}@container-engine-robot.iam.gserviceaccount.com"
}
*/