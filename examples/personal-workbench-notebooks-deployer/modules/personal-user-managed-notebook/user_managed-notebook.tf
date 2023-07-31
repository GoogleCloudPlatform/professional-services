# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

resource "google_notebooks_instance" "user_managed_instance" {
  depends_on   = [
    google_storage_bucket_object.dataproc_template_file_generator,
    google_storage_bucket_object.dataproc_source_templates
  ]
  for_each     = toset(var.notebook_users_list)
  project      = var.project_id
  name         = join("-", [var.user_managed_instance_prefix, split("@", each.key)[0]])
  location     = var.zone
  machine_type = var.machine_type

  vm_image {
    project      = "deeplearning-platform-release"
    image_family = "common-container"
  }

  post_startup_script = join("/", ["gs:/", var.personal_dataproc_notebooks_bucket_name, "template_generator.sh"])
  no_public_ip        = var.no_public_ip

  network = data.google_compute_network.my_network.id
  subnet  = data.google_compute_subnetwork.my_subnetwork.id
  tags    = var.networking_tags

  instance_owners = [each.key]
  service_account = google_service_account.notebook_instance_sa.email

  metadata = {
    report-container-health          = "true"
    dataproc-configs                 = join("/", [
      var.personal_dataproc_notebooks_bucket_name, var.generated_templates_path_name, each.key
    ])
    templates_bucket_name            = var.personal_dataproc_notebooks_bucket_name
    generated_templates_path_name    = var.generated_templates_path_name
    master_templates_path_name       = var.master_templates_path_name
    dataproc_yaml_template_file_name = var.dataproc_yaml_template_file_name
    agent-health-check-path          = "/hub/health"
    report-system-health             = "true"
    framework                        = "Dataproc Hub"
    disable-swap-binaries            = "true"
    serial-port-logging-enable       = "true"
    warmup-libraries                 = "matplotlib.pyplot"
    notebooks-api                    = "PROD"
    enable-oslogin                   = "TRUE"
    disable-mixer                    = "true"
    container-env-file               = ""
    shutdown-script                  = "/opt/deeplearning/bin/shutdown_script.sh"
    proxy-mode                       = "mail"
    instance-subnet-uri              = data.google_compute_subnetwork.my_subnetwork.self_link
    container                        = "gcr.io/cloud-dataproc/dataproc-spawner:prod"
    enable-guest-attributes          = "TRUE"
    notebooks-api-version            = "v1"
    container-use-host-network       = "True"
    agent-env-file                   = "gs://dataproc-spawner-dist/env-agent"
    jupyterhub-host-type             = "ain"
    proxy-user-mail                  = each.key
    restriction                      = ""
    proxy-url                        = "c2adc4415a9b004-dot-${var.region}.notebooks.googleusercontent.com"
    title                            = "Base.Container.GPU"
    version                          = "108"
  }
}