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

data "vsphere_datacenter" "vsphere_dc" {
  name = var.vsphere_environment.data_center
}

data "vsphere_resource_pool" "vsphere_pool" {
  name          = var.vsphere_environment.resource_pool
  datacenter_id = data.vsphere_datacenter.vsphere_dc.id
}

data "vsphere_host" "vsphere_host" {
  name          = var.vsphere_environment.host_ip
  datacenter_id = data.vsphere_datacenter.vsphere_dc.id
}

data "vsphere_datastore" "vsphere_datastore" {
  name          = var.vsphere_environment.datastore
  datacenter_id = data.vsphere_datacenter.vsphere_dc.id
}

data "vsphere_network" "vsphere_network" {
  name          = var.vsphere_environment.virtual_net
  datacenter_id = data.vsphere_datacenter.vsphere_dc.id
}
