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

# tfdoc:file:description Creates SQL Server instances and witness.
locals {
  _functions = templatefile("${path.module}/scripts/functions.ps1", local._template_vars0)
  _scripts = [
    "specialize-node",
    "specialize-witness",
    "windows-startup-node",
    "windows-startup-witness"
  ]
  _secret_parts = split("/", module.secret-manager.secrets[local.ad_user_password_secret].id)
  _template_vars0 = {
    prefix                    = var.prefix
    ad_domain                 = var.ad_domain_fqdn
    ad_netbios                = var.ad_domain_netbios
    managed_ad_dn             = var.managed_ad_dn
    managed_ad_dn_path        = var.managed_ad_dn != "" ? "-Path \"${var.managed_ad_dn}\"" : ""
    health_check_port         = var.health_check_port
    sql_admin_password_secret = local._secret_parts[length(local._secret_parts) - 1]
    cluster_ip                = module.ip-addresses.internal_addresses["${local.prefix}cluster"].address
    loadbalancer_ips          = jsonencode({ for aog in var.always_on_groups : aog => module.ip-addresses.internal_addresses["${local.prefix}lb-${aog}"].address })
    sql_cluster_name          = local.cluster_netbios_name
    sql_cluster_full          = local.cluster_full_name
    node_netbios_1            = local.node_netbios_names[0]
    node_netbios_2            = local.node_netbios_names[1]
    witness_netbios           = local.witness_netbios_name
    always_on_groups          = join(",", var.always_on_groups)
    sql_user_name             = length(local._user_name) > 20 ? substr(local._user_name, 0, 20) : local._user_name
  }
  _template_vars = merge(local._template_vars0, {
    functions = local._functions
  })
  _user_name = "${local.prefix}sqlserver"
  scripts = {
    for script in local._scripts :
    script => templatefile("${path.module}/scripts/${script}.ps1", local._template_vars)
  }
}


# Nodes
module "nodes" {
  source   = "../../../modules/compute-vm"
  for_each = toset(local.node_netbios_names)

  project_id = var.project_id
  zone       = local.node_zones[each.value]
  name       = each.value

  instance_type = var.node_instance_type

  network_interfaces = [{
    network    = local.network
    subnetwork = local.subnetwork
    nat        = false
    addresses = {
      internal = module.ip-addresses.internal_addresses[each.value].address
      external = null
    }
  }]

  boot_disk = {
    image = var.node_image
    type  = "pd-ssd"
    size  = var.boot_disk_size
  }

  attached_disks = [{
    name        = "${each.value}-datadisk"
    size        = var.data_disk_size
    source_type = null
    source      = null
    options     = null
  }]

  service_account        = module.compute-service-account.email
  service_account_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  metadata = {
    enable-wsfc                   = "true"
    sysprep-specialize-script-ps1 = local.scripts["specialize-node"]
    windows-startup-script-ps1    = local.scripts["windows-startup-node"]
  }

  group = {
    named_ports = {
    }
  }

  service_account_create = false
  create_template        = false
}

# Witness
module "witness" {
  source   = "../../../modules/compute-vm"
  for_each = toset([local.witness_netbios_name])

  project_id = var.project_id
  zone       = local.node_zones[each.value]
  name       = each.value

  instance_type = var.witness_instance_type

  network_interfaces = [{
    network    = local.network
    subnetwork = local.subnetwork
    nat        = false
    addresses = {
      internal = module.ip-addresses.internal_addresses[each.value].address
      external = null
    }
  }]

  boot_disk = {
    image = var.witness_image
    type  = "pd-ssd"
    size  = var.boot_disk_size
  }

  service_account        = module.witness-service-account.email
  service_account_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  metadata = {
    sysprep-specialize-script-ps1 = local.scripts["specialize-witness"]
    windows-startup-script-ps1    = local.scripts["windows-startup-witness"]
  }

  service_account_create = false
  create_template        = false
}
