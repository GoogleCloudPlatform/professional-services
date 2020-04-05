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
output project_id {
  description = "The Project ID for this VPC"
  value       = module.vpc_setup.project_id
}

output vpc_self_link {
  description = "The Self Link for this VPC"
  value       = module.vpc_setup.vpc_self_link
}

output subnets_self_links {
  description = "The List of Subnetwork Self Links created by this module"
  value       = module.vpc_setup.subnets_self_links
}

output network_name {
  description = "The name of this VPC Network"
  value       = module.vpc_setup.network_name
}

output subnets {
  description = "Mapping of subnet_region/subnet_name => subnetwork resource"
  value       = module.vpc_setup.subnets
}

