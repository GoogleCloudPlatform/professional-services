#    Copyright 2023 Google LLC

#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at

#        http://www.apache.org/licenses/LICENSE-2.0

#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.

module "gce_template" {
  source     = "terraform-google-modules/vm/google//modules/instance_template"
  version    = "~> 7.9"
  network    = google_compute_network.default.self_link
  subnetwork = google_compute_subnetwork.subnet.self_link
  service_account = {
    email  = google_service_account.gce_sa.email
    scopes = ["cloud-platform"]
  }
  name_prefix          = "container-vm"
  metadata = {
    user-data = file("${path.module}/config/cloud-init.yaml")
  }
  source_image_family  = "cos-stable"
  source_image_project = "cos-cloud"
  tags = ["allow-iap-ssh", "allow-http"]
  depends_on = [ google_project_service.apis ]
}

resource "google_service_account" "gce_sa" {
  account_id = "gce-backend"
}

module "webserver" {
  source            = "terraform-google-modules/vm/google//modules/mig"
  project_id        = data.google_project.project.project_id
  region            = var.region
  target_size       = 1
  hostname          = "webserver"
  instance_template = module.gce_template.self_link
  named_ports =[{
    name = "http"
    port = "80"
  }]
}