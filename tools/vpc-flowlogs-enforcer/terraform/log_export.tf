/*
 * Copyright 2021 Google LLC. This software is provided as-is, without warranty
 * or representation for any use or purpose. Your use of it is subject to your 
 * agreement with Google.  
 */

# Logs sink that sends messages to a Pub/Sub topic when a subnet is created or
# modified.
resource "google_logging_folder_sink" "subnet_change" {
  count            = length(var.enforcement_folders) * (var.configure_log_sinks ? 1 : 0)
  name             = "subnet-change-sink-${count.index}"
  folder           = var.enforcement_folders[count.index]
  include_children = true

  # Sends the messages to a Pub/Sub topic in the shared services project.
  destination = "pubsub.googleapis.com/${google_pubsub_topic.subnet_change.id}"

  # Filter the subnet modification logs
  filter = <<-EOT
  resource.type="gce_subnetwork" AND 
  jsonPayload.event_type="GCE_OPERATION_DONE" AND
  (jsonPayload.event_subtype="compute.subnetworks.insert" OR jsonPayload.event_subtype="compute.subnetworks.patch") AND
  jsonPayload.actor.user!="${google_service_account.net_logs_cf.email}"
  EOT
}
