/**
 * Copyright 2024 Google LLC
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

module "l4-rilb" {
  for_each            = var.locations
  source              = "./modules/l4rilb"
  project_id          = var.project_id
  location            = each.key
  lb_name             = "l4-rilb-${each.key}"
  mig_instance_group  = module.mig-l4[each.key].instance_group
  image               = var.image
  network_id          = data.google_compute_network.lb_network.id
  subnetwork_id       = data.google_compute_subnetwork.lb_subnetwork[each.key].name

  depends_on = [ 
    google_compute_subnetwork.proxy_subnetwork 
  ]
}
