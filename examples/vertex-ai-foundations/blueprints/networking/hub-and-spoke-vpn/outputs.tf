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

output "subnets" {
  description = "Subnet details."
  value = {
    dev = {
      for k, v in module.dev-vpc.subnets : k => {
        id            = v.id
        ip_cidr_range = v.ip_cidr_range
      }
    }
    landing = {
      for k, v in module.landing-vpc.subnets : k => {
        id            = v.id
        ip_cidr_range = v.ip_cidr_range
      }
    }
    prod = {
      for k, v in module.prod-vpc.subnets : k => {
        id            = v.id
        ip_cidr_range = v.ip_cidr_range
      }
    }
  }
}

output "vms" {
  description = "GCE VMs."
  value = {
    for mod in [module.landing-r1-vm, module.dev-r2-vm, module.prod-r1-vm] :
    mod.instance.name => mod.internal_ip
  }
}
