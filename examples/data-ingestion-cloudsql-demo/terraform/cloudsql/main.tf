# Copyright 2022 Google. This software is provided as-is, without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

module "db" {
  source           = "https://github.com/GoogleCloudPlatform/cloud-foundation-fabric/tree/v16.0.0/modules/cloudsql-instance"
  project_id       = var.project
  network          = var.network.self_link
  name             = var.instance_name
  region           = var.region
  database_version = var.database_version
  tier             = var.tier
  databases = [
    "people",
    "departments"
  ]
  postgres_client_cert = [
    "terraform-test"
  ]
  authorized_networks = var.authorized_networks

  users = {
    # generatea password for user1
    cloudsql-vmo2 = null
    # assign a password to user2
    user2 = "mypassword"
  }


  #   backup_configuration = {
  #     enabled            = true
  #     binary_log_enabled = true
  #     start_time         = "15:30"
  #     location           = "europe-west3"
  #     log_retention_days = 7
  #     retention_count    = 7
  #   }

}


