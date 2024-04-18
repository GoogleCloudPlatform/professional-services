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

module "l7-crilb-mig" {
  source            = "./modules/l7crilb"
  project_id        = var.project_id
  lb_name           = "l7-crilb-mig"

  network_id        = data.google_compute_network.lb_network.name
  subnetwork_ids    = { for k, v in data.google_compute_subnetwork.lb_subnetwork : k => v.id }
  certificate_id    = google_certificate_manager_certificate.ccm-cert.id
  backend_group_ids = [ for k, v in module.mig-l7 : v.instance_group ]
  backend_protocol  = "HTTP"

  depends_on = [ 
    google_compute_subnetwork.proxy_subnetwork 
  ]
}
