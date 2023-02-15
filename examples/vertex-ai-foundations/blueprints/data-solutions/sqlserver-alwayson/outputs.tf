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
  loadbalancer_outputs = [for aog in var.always_on_groups : format("%s (%s)", module.listener-ilb[aog].forwarding_rule_address, aog)]
}

output "instructions" {
  value = <<EOF
        Log-in to all 3 instances with Administrator credentials and run the following PowerShell command:

        Add-Computer -Domain ${var.ad_domain_fqdn} -Restart

        On the first instance and the second instance, as Domain Administrator, please run the following 
        PowerShell script: C:\InitializeCluster.ps1

        Follow the instructions from here: https://cloud.google.com/compute/docs/instances/sql-server/configure-availability#creating_an_availability_group
        Use the following listener IP addresses for: ${join(", ", local.loadbalancer_outputs)}
    EOF
}