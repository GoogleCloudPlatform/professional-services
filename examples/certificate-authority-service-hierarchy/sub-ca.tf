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

module "sub-ca1" {
  source = "./modules/cas-ca"

  tier                = var.tier
  project_id          = var.project_id
  ca_name             = var.sub_ca1_name
  location            = var.location1
  ca_pool_name        = module.sub-pool1.name
  type                = "SUBORDINATE"
  root_ca_id          = module.root-ca.id
  algorithm           = var.algorithm 

  common_name         = var.subca1_common_name
  domain              = var.domain
  country_code        = var.country_code
  organization_name   = var.organization_name
  organizational_unit = var.organizational_unit
  locality            = var.locality
  province            = var.province

  depends_on = [
    module.root-ca,
    module.root-pool,
    module.sub-pool1
  ]
}

module "sub-ca2" {
  source = "./modules/cas-ca"

  tier                = var.tier
  project_id          = var.project_id
  ca_name             = var.sub_ca2_name
  location            = var.location2
  ca_pool_name        = module.sub-pool2.name
  type                = "SUBORDINATE"
  root_ca_id          = module.root-ca.id 
  algorithm           = var.algorithm 

  common_name         = var.subca2_common_name
  domain              = var.domain
  country_code        = var.country_code
  organization_name   = var.organization_name
  organizational_unit = var.organizational_unit
  locality            = var.locality
  province            = var.province

  depends_on = [
    module.root-ca,
    module.root-pool,
    module.sub-pool2
  ]
}
