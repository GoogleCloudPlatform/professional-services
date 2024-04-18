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

module "gce-container" {
  source = "terraform-google-modules/container-vm/google"
  container = {
    image = var.image
    env = [
      {
        name = "NAME"
        value = "hello"
      }
    ]
  }
}

data "google_compute_default_service_account" "default" {
}
module "mig_template" {
  source               = "terraform-google-modules/vm/google//modules/instance_template"
  version              = "~> 10.1"
  network              = var.network_id
  subnetwork           = var.subnetwork_id
  name_prefix          = "mig-ilb"
  service_account      = {
    email  = data.google_compute_default_service_account.default.email
    scopes = ["cloud-platform"]
  }
  source_image_family  = "cos-stable"
  source_image_project = "cos-cloud"
  machine_type         = "e2-small"
  source_image         = reverse(split("/", module.gce-container.source_image))[0]
  metadata             = merge(var.additional_metadata, { "gce-container-declaration" = module.gce-container.metadata_value })
  tags = [
    "container-vm-test-mig"
  ]
  labels = {
    "container-vm" = module.gce-container.vm_container_label
  }
}

module "mig" {
  source             = "terraform-google-modules/vm/google//modules/mig"
  version            = "~> 10.1"
  project_id         = var.project_id

  region             = var.location
  instance_template  = module.mig_template.self_link
  hostname           = "${var.name}"
  target_size        = "1"
  
  autoscaling_enabled = "true"
  min_replicas = "1"
  max_replicas = "1"
  named_ports = [{
    name = var.lb_proto
    port = var.lb_port
  }] 

  health_check_name = "${var.name}-http-healthcheck"
  health_check = {
    type = "http"
    initial_delay_sec   = 10
    check_interval_sec  = 2
    healthy_threshold   = 1
    timeout_sec         = 1
    unhealthy_threshold = 1
    port                = 8080
    response            = ""
    proxy_header        = "NONE"
    request             = ""
    request_path        = "/"
    host                = ""
    enable_logging      = true
  }
}
