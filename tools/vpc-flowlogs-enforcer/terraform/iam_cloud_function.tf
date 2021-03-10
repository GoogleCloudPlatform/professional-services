/*
 * Copyright 2021 Google LLC. This software is provided as-is, without warranty
 * or representation for any use or purpose. Your use of it is subject to your 
 * agreement with Google.  
 */

# These are the permissions required by the network logs enforcer cloud function.
# We create a custom role with just the minimum required permissions.
resource "google_organization_iam_custom_role" "net_log_enforcer" {
  org_id      = var.gcp_org_id
  role_id     = "netLogEnforcer${local.suffix}"
  title       = "Net log enforcer"
  description = "permissions required by the net log enabler cloud function."
  permissions = [
    "compute.subnetworks.get",
    "compute.subnetworks.update",
  ]
}

# Crant the permission to mdify subnets to the cloud function service account
# in the folders where the enforcement is being applied.
resource "google_folder_iam_member" "net_log_enforcer" {
  count  = length(var.enforcement_folders)
  folder = var.enforcement_folders[count.index]
  role   = google_organization_iam_custom_role.net_log_enforcer.id
  member = "serviceAccount:${google_service_account.net_logs_cf.email}"
}