# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

resource "google_compute_region_health_check" "consul_hc" {
  name   = "consul-demo-ilb-hc"
  region = var.region
  http_health_check {
    request_path = "/v1/health/checks/consul?dc=${var.region}"
    port         = "8500"
  }
}

resource "google_compute_address" "ilb" {
  name         = "consul-demo-static-ip"
  subnetwork   = var.subnet
  address_type = "INTERNAL"
  address      = var.static_ip
  region       = var.region
  purpose      = "SHARED_LOADBALANCER_VIP"
}

resource "google_compute_region_backend_service" "tcp" {
  name                  = "consul-demo-tcp-ilb"
  protocol              = "TCP"
  region                = var.region
  load_balancing_scheme = "INTERNAL"
  health_checks         = [google_compute_region_health_check.consul_hc.id]
  backend {
    group          = var.instance_group_id
    balancing_mode = "CONNECTION"
  }
}

resource "google_compute_forwarding_rule" "tcp" {
  ip_address            = google_compute_address.ilb.address
  name                  = "consul-demo-tcp-fr"
  backend_service       = google_compute_region_backend_service.tcp.id
  region                = var.region
  ip_protocol           = "TCP"
  load_balancing_scheme = "INTERNAL"
  ports                 = ["53", "8301"]
  allow_global_access   = false
  subnetwork            = var.subnet
}


resource "google_compute_region_backend_service" "udp" {
  name                  = "consul-demo-udp-ilb"
  protocol              = "UDP"
  region                = var.region
  load_balancing_scheme = "INTERNAL"
  health_checks         = [google_compute_region_health_check.consul_hc.id]
  backend {
    group          = var.instance_group_id
    balancing_mode = "CONNECTION"
  }
}

resource "google_compute_forwarding_rule" "udp" {
  ip_address            = google_compute_address.ilb.address
  name                  = "consul-demo-udp-fr"
  backend_service       = google_compute_region_backend_service.udp.id
  region                = var.region
  ip_protocol           = "UDP"
  load_balancing_scheme = "INTERNAL"
  ports                 = ["53"]
  allow_global_access   = false
  subnetwork            = var.subnet
}

