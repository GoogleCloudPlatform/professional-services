/**
 * Copyright 2022 Google LLC
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

module "peering-dev" {
  source        = "../modules/net-vpc-peering"
  prefix        = "dev-peering-0"
  local_network = module.dev-spoke-vpc.self_link
  peer_network  = module.common-vpc.self_link
  export_local_custom_routes = try(
    var.peering_configs.dev.export_local_custom_routes, null
  )
  export_peer_custom_routes = try(
    var.peering_configs.dev.export_peer_custom_routes, null
  )
}

module "peering-prod" {
  source        = "../modules/net-vpc-peering"
  prefix        = "prod-peering-0"
  local_network = module.prod-spoke-vpc.self_link
  peer_network  = module.common-vpc.self_link
  depends_on    = [module.peering-dev]
  export_local_custom_routes = try(
    var.peering_configs.prod.export_local_custom_routes, null
  )
  export_peer_custom_routes = try(
    var.peering_configs.prod.export_peer_custom_routes, null
  )
}

