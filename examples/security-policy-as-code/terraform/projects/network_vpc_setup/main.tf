/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module "vpc_setup" {
  source = "../../modules/pci-starter-vpc"

  is_shared_vpc_host = var.is_shared_vpc_host
  project_id         = local.project_network
  region             = var.region
  vpc_name           = var.shared_vpc_name

  # Management Subnetwork
  mgmt_subnet_name = var.mgmt_subnet_name
  mgmt_subnet_cidr = var.mgmt_subnet_cidr

  # In Scope Subnetwork
  in_scope_subnet_name            = var.in_scope_subnet_name
  in_scope_subnet_cidr            = var.in_scope_subnet_cidr
  in_scope_services_ip_range_name = var.in_scope_services_ip_range_name
  in_scope_pod_ip_range_name      = var.in_scope_pod_ip_range_name

  # Out of Scope Subnetwork
  out_of_scope_subnet_name            = var.out_of_scope_subnet_name
  out_of_scope_subnet_cidr            = var.out_of_scope_subnet_cidr
  out_of_scope_services_ip_range_name = var.out_of_scope_services_ip_range_name
  out_of_scope_pod_ip_range_name      = var.out_of_scope_pod_ip_range_name


}
