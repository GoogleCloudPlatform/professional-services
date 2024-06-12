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

locals {
  named_ports = [{
    name = var.lb_proto
    port = var.lb_port
  }]
  health_check = {
    type                = var.lb_proto
    check_interval_sec  = 1
    healthy_threshold   = 4
    timeout_sec         = 1
    unhealthy_threshold = 5
    response            = ""
    proxy_header        = "NONE"
    port                = var.lb_port
    port_name           = "health-check-port"
    request             = ""
    request_path        = "/"
    host                = "1.2.3.4"
    enable_log          = false
  }
}
module "l4rilb" {
  source        = "GoogleCloudPlatform/lb-internal/google"
  project       = var.project_id
  region        = var.location
  name          = "${var.lb_name}"
  ports         = [local.named_ports[0].port]
  source_tags   = ["allow-group1"]
  target_tags   = ["container-vm-test-mig"]
  health_check  = local.health_check
  global_access = true

  backends = [
    {
      group       = var.mig_instance_group
      description = ""
      failover    = false
    }
  ]
}
