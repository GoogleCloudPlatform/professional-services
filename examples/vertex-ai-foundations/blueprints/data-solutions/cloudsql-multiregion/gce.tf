# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

locals {
  startup-script = <<END
  #! /bin/bash
  sudo apt-get update
  sudo apt-get install -y postgresql-client wget
  sudo wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O /usr/local/bin/cloud_sql_proxy
  sudo chmod a+x /usr/local/bin/cloud_sql_proxy
  sudo ln -s /usr/local/bin/cloud_sql_proxy /usr/lib/google-cloud-sdk/bin/cloud_sql_proxy
  END
}

module "test-vm" {
  source     = "../../../modules/compute-vm"
  project_id = module.project.project_id
  zone       = "${var.regions.primary}-b"
  name       = "sql-test"
  network_interfaces = [{
    network    = local.vpc_self_link
    subnetwork = local.subnet
    nat        = false
    addresses  = null
  }]
  attached_disks = [
    {
      name        = "attached-disk"
      size        = 10
      source      = null
      source_type = null
      options     = null
    }
  ]
  service_account        = module.service-account-sql.email
  service_account_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  boot_disk = {
    image = "projects/debian-cloud/global/images/family/debian-10"
    type  = "pd-ssd"
    size  = 10
  }
  encryption = var.service_encryption_keys != null ? {
    encrypt_boot            = true
    disk_encryption_key_raw = null
    kms_key_self_link       = var.service_encryption_keys != null ? try(var.service_encryption_keys[var.regions.primary], null) : null
  } : null
  metadata = { startup-script = local.startup-script }
  tags     = ["ssh"]
}
