/*
 * Copyright 2021 Google LLC. This software is provided as-is, without warranty
 * or representation for any use or purpose. Your use of it is subject to your 
 * agreement with Google.  
 */

# Logs sink that sends messages to a Pub/Sub topic when a subnet is created or
# modified.
resource "google_logging_folder_sink" "subnet_change" {
  # enable log sinks only if CAI feeds are not also enabled
  count            = length(var.enforcement_folders) * ((var.configure_log_sinks && !var.configure_asset_feeds) ? 1 : 0)
  name             = "subnet-change-sink-${count.index}"
  folder           = var.enforcement_folders[count.index]
  include_children = true

  # Sends the messages to a Pub/Sub topic in the shared services project.
  destination = "pubsub.googleapis.com/${google_pubsub_topic.subnet_change.id}"

  # Filter the subnet modification logs
  filter = <<-EOT
  resource.type="gce_subnetwork"
  protoPayload.@type="type.googleapis.com/google.cloud.audit.AuditLog"
  operation.last="true"
  -protoPayload.authenticationInfo.principalEmail="${google_service_account.net_logs_cf.email}"
  EOT
}
