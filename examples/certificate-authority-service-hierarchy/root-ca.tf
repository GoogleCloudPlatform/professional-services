/**
 * Copyright 2023 Google LLC
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

module "root-ca" {
  source = "./modules/cas-ca"

  tier                = var.tier
  project_id          = var.project_id
  ca_name             = var.root_ca_name
  location            = var.location1
  ca_pool_name        = module.root-pool.name
  type                = "SELF_SIGNED"
  algorithm           = var.algorithm 

  common_name         = var.root_common_name
  domain              = var.domain
  country_code        = var.country_code
  organization_name   = var.organization_name
  organizational_unit = var.organizational_unit
  locality            = var.locality
  province            = var.province

  depends_on = [
    module.root-pool
  ]
}
