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

resource "google_notebooks_runtime" "managed_instance" {
  for_each     = toset(var.notebook_users_list)
  project      = var.project_id
  name         = join("-", [var.managed_instance_prefix, split("@", each.key)[0]])
  location     = var.region

  access_config {
    access_type = "SINGLE_USER"
    runtime_owner = each.key
  }

  virtual_machine {
    virtual_machine_config {
      machine_type = var.machine_type
      network = data.google_compute_network.my_network.id
      subnet  = data.google_compute_subnetwork.my_subnetwork.id
      data_disk {
        initialize_params {
          disk_size_gb = "100"
          disk_type = "PD_STANDARD"
        }
      }
    }
  }
}