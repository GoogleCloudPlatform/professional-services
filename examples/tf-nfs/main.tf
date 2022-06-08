module "nfs-api" {
  source  = "terraform-google-modules/project-factory/google//modules/project_services"
  version = "10.1.1"

  project_id = var.project_id
  activate_apis = [
    "cloudvolumesgcp-api.netapp.com",
    "serviceusage.googleapis.com"
  ]
}

# Creates NFS Service account with local limited rights to limit exposure.
# NOTE: Service account must be granted "roles/compute.networkViewer" role in dbk-global-networking
# module "nfs-service_account" {
#   source       = "git::https://github.com/ncr-swt-sre/sreg-gcp-modules.git//modules/service_accounts/?ref=0.101.0"
#   project_name = var.project_id
#   name         = "nfs-sa-${var.environment}"
#   description  = "NFS Service Account"
#   roles        = ["roles/netappcloudvolumes.admin"]

#   depends_on = [
#     module.nfs-api
#   ]
# }

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
  name           = "${each.key}-${each.value.app_component}-${var.environment}-${lookup({ us-west2 = "wug02", us-central1 = "cug01" }, each.value.region, "wug02")}"
  region         = each.value.region
  protocol_types = each.value.protocol_types
  # shared_vpc_project_number = "232062438414" # dbk-global-networking
  delete_on_creation_error = true
  network                  = each.value.network
  size                     = each.value.size
  service_level            = each.value.service_level
  volume_path              = "${each.key}-${each.value.app_component}-${var.environment}-${lookup({ us-west2 = "wug02", us-central1 = "cug01" }, each.value.region, "wug02")}"

  dynamic "snapshot_policy" {
    for_each = each.value.snapshot_policy.enabled == true ? [1] : []
    content {
      enabled = each.value.snapshot_policy.enabled
      dynamic "monthly_schedule" {
        for_each = each.value.snapshot_policy.monthly_snapshot == true ? [1] : []
        content {
          
          snapshots_to_keep = try(each.value.snapshot_policy.snapshots_to_keep, 0)
          hour = try(each.value.snapshot_policy.hour, 0)
        }
      }
      dynamic "weekly_schedule" {
        for_each = each.value.snapshot_policy.weekly_snapshot == true ? [1] : []
        content {
          snapshots_to_keep = each.value.snapshot_policy.snapshots_to_keep != "" ? each.value.snapshot_policy.snapshots_to_keep : null
        }
      }
      dynamic "daily_schedule" {
        for_each = each.value.snapshot_policy.daily_snapshot == true ? [1] : []
        content {
          snapshots_to_keep = each.value.snapshot_policy.snapshots_to_keep
        }
        # monthly_schedule {
        #   # for_each = each.value.snapshot_policy.daily == true ? [1] : []        
        #     snapshots_to_keep = each.value.snapshot_policy.snapshots_to_keep       

      }

    }
  }
  #snapshot_policy {

  #  enabled = each.value.enabled_snap
  # TODO: Implement snapshot handling.
  # daily_schedule { # Implement only if there's a daily_schedule block otherwise skip it
  #   hour   = 10
  #   minute = 1
  # }

  # daily_schedule {
  #   snapshots_to_keep = 7
  # }
  # dynamic "daily_schedule" {
  #   for_each = each.value.snapshot_policy
  #   content {
  #     hour = daily_schedule.value.hour
  #   }
  # }
  #   dynamic "daily_schedule" {
  #   for_each = each.value.enabled_snap == true ? [1] : []
  #   content {
  #     snapshots_to_keep = 7
  #   }
  # }
  #}
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