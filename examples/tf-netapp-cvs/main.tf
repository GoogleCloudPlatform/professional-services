
# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


module "nfs-api" {
  source  = "terraform-google-modules/project-factory/google//modules/project_services"
  version = "10.1.1"

  project_id = var.project_id
  activate_apis = [
    "cloudvolumesgcp-api.netapp.com",
    "serviceusage.googleapis.com"
  ]
}

resource "google_service_account" "service_account" {
  project      = var.project_id
  account_id   = "nfs-sa"
  display_name = "nfs service account"
}

resource "google_project_iam_member" "roles" {
  project = google_service_account.service_account.project
  # for_each = toset(var.roles)
  role   = "roles/netappcloudvolumes.admin"
  member = "serviceAccount:${google_service_account.service_account.email}"
}

resource "google_service_account_key" "nfs-key" {
  service_account_id = google_service_account.service_account.account_id

  depends_on = [
    google_service_account.service_account
  ]
}

resource "netapp-gcp_volume" "nfs-volume" {
  for_each = var.nfs-volumes

  provider       = netapp-gcp
  name           = each.key
  region         = var.region
  protocol_types = each.value.protocol_types
  # shared_vpc_project_number = "<Shared VPC Project Number>" # Add Shared Project Number if you are using Shared VPC
  delete_on_creation_error = true
  network                  = var.network_name
  size                     = each.value.size
  service_level            = var.service_level
  storage_class            = "hardware"
  volume_path              = each.key

  # Snapshots cannot be disabled once they are enabled using the below logic.
  dynamic "snapshot_policy" {
    for_each = each.value.snapshot_policy.enabled == true ? [1] : []
    content {
      enabled = each.value.snapshot_policy.enabled

      dynamic "monthly_schedule" {
        for_each = each.value.snapshot_policy.monthly_snapshot == true ? [1] : []
        content {
          days_of_month     = each.value.snapshot_policy.days_of_month
          minute            = each.value.snapshot_policy.monthly_minute
          hour              = each.value.snapshot_policy.monthly_hour
          snapshots_to_keep = each.value.snapshot_policy.monthly_snapshots_to_keep
        }
      }
      dynamic "weekly_schedule" {
        for_each = each.value.snapshot_policy.weekly_snapshot == true ? [1] : []
        content {
          day               = each.value.snapshot_policy.day
          minute            = each.value.snapshot_policy.weekly_minute
          hour              = each.value.snapshot_policy.weekly_hour
          snapshots_to_keep = each.value.snapshot_policy.weekly_snapshots_to_keep
        }
      }
      dynamic "daily_schedule" {
        for_each = each.value.snapshot_policy.daily_snapshot == true ? [1] : []
        content {
          minute            = each.value.snapshot_policy.daily_minute
          hour              = each.value.snapshot_policy.daily_hour
          snapshots_to_keep = each.value.snapshot_policy.daily_snapshots_to_keep
        }
      }
      dynamic "hourly_schedule" {
        for_each = each.value.snapshot_policy.hourly_snapshot == true ? [1] : []
        content {
          minute = try(each.value.snapshot_policy.hourly_minute, 0)
        }
      }
    }
  }
  export_policy {
    dynamic "rule" {
      for_each = each.value.export_policy
      content {
        allowed_clients = rule.value.allowed_clients
        access          = rule.value.access

        nfsv3 {
          checked = true
        }
        nfsv4 {
          checked = false
        }
      }
    }
  }
  depends_on = [
    google_service_account.service_account
  ]
}

# Replication Volumes
resource "netapp-gcp_volume" "replication-volume" {
  for_each = { for volume-name, v in var.nfs-volumes : volume-name => v if v.replication == true }

  provider       = netapp-gcp
  name           = each.key
  region         = lookup({ us-west2 = "us-central1", us-central1 = "us-west2" }, var.region, "us-central1") # Set region to OPPOSITE of the primary
  protocol_types = each.value.protocol_types
  # shared_vpc_project_number = "<Shared VPC Project Number>"
  delete_on_creation_error = true
  network                  = var.network_name
  size                     = each.value.size
  service_level            = var.service_level
  storage_class            = "hardware"
  type_dp                  = "true"
  volume_path              = each.key

  export_policy {
    dynamic "rule" {
      for_each = each.value.export_policy
      content {
        allowed_clients = rule.value.allowed_clients
        access          = rule.value.access

        nfsv3 {
          checked = true
        }
        nfsv4 {
          checked = false
        }
      }
    }
  }
  depends_on = [
    google_service_account.service_account
  ]
}

resource "netapp-gcp_volume_replication" "volume-replication" {
  for_each              = netapp-gcp_volume.replication-volume
  provider              = netapp-gcp
  name                  = "${each.key}-replication"
  region                = each.value.region
  remote_region         = lookup({ us-west2 = "us-central1", us-central1 = "us-west2" }, var.region, "us-west2") # This should be the opposite region. Full list of region pairs here: https://cloud.google.com/architecture/partners/netapp-cloud-volumes/volume-replication#requirements_and_considerations_for_volume_replication
  destination_volume_id = netapp-gcp_volume.replication-volume[each.key].id                                      # This takes the UUID of the replica volume
  source_volume_id      = netapp-gcp_volume.nfs-volume[each.key].id                                              # This takes in the UUID of the source volume
  schedule              = "hourly"
  endpoint_type         = "dst"
}