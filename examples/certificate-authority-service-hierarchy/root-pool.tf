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

module "root-pool" {
  source = "./modules/cas-pool"

  project_id          = var.project_id
  location            = var.location1
  name                = var.root_pool_name
  tier                = "ENTERPRISE"

  cert_managers             = concat(var.cert_managers, local.cert_managers)
  cert_auditors             = concat(var.cert_auditors, local.cert_auditors)
  workload_cert_requesters  = concat(var.workload_cert_requesters, local.workload_cert_requesters)
  cert_requesters           = concat(var.cert_managers, local.cert_requesters)

  depends_on = [
    time_sleep.wait_enable_service
  ]
}