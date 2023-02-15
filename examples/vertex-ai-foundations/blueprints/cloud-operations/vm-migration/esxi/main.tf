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
  rsa-public-key = file(var.m4ce_ssh_public_key)
}

resource "vsphere_role" "gcp-m4ce-role" {
  name = "gcp-m4ce-role"
  role_privileges = [
    "Global.DisableMethods",
    "Global.EnableMethods",
    "VirtualMachine.Config.ChangeTracking",
    "VirtualMachine.Interact.PowerOff",
    "VirtualMachine.Provisioning.DiskRandomRead",
    "VirtualMachine.Provisioning.GetVmFiles",
    "VirtualMachine.State.CreateSnapshot",
    "VirtualMachine.State.RemoveSnapshot"
  ]
}

resource "vsphere_virtual_machine" "gcp-m4ce-connector" {
  name             = var.m4ce_appliance_properties.hostname
  resource_pool_id = data.vsphere_resource_pool.vsphere_pool.id
  datastore_id     = data.vsphere_datastore.vsphere_datastore.id
  host_system_id   = data.vsphere_host.vsphere_host.id
  datacenter_id    = data.vsphere_datacenter.vsphere_dc.id
  num_cpus         = 4
  memory           = 16384

  network_interface {
    network_id = data.vsphere_network.vsphere_network.id
  }

  wait_for_guest_net_timeout = 0
  wait_for_guest_ip_timeout  = 0

  scsi_type = "lsilogic-sas"

  ovf_deploy {
    remote_ovf_url = var.m4ce_connector_ovf_url
  }

  vapp {
    properties = merge({ "public-keys" = local.rsa-public-key }, var.m4ce_appliance_properties)
  }
}
