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

resource "google_dns_record_set" "a_l7_crilb_cr_hello" {
  name         = "l7-crilb-cr.${google_dns_managed_zone.hello_zone.dns_name}"
  managed_zone = google_dns_managed_zone.hello_zone.name
  type         = "A"
  ttl          = 1

  routing_policy {
    dynamic "geo" {
      for_each  = var.locations
      content {
        location  = geo.key
        health_checked_targets {
          internal_load_balancers {
              ip_address         = module.l7-crilb-cr.lb_ip_address[geo.key]
              ip_protocol        = "tcp"
              load_balancer_type = "globalL7ilb"
              network_url        = data.google_compute_network.lb_network.id
              port               = "443"
              project            = var.project_id
            }
        }
      }
    }
  }  
}
