# Copyright 2022 Google LLC All Rights Reserved.
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

terraform {
    backend "gcs" {
        #TODO: Set bucket to store tfstate
        #bucket  = "ccm-tf-state"
        prefix  = "terraform_deploy/state"

    }
}

module "ccm_composer" {
    source = "../modules/ccm-composer"

    project_id              = var.project_id
    region                  = var.region

    composer = {
        instance_name       = var.composer_instance_name
        image               = var.composer_image
        network_id          = var.composer_network_id
        subnetwork_id       = var.composer_subnetwork_id
        service_account     = var.service_account
        private_ip          = var.composer_private_ip
        env_variables       = {}
    }
}

resource "google_storage_bucket_object" "upload_to_dag_folder" {
    for_each = {for file in var.files_path: file.local_file => file} 
    name   = "${each.value.gcs_path}"
    source = "${each.value.local_file}"
    bucket = regex("(?:us|eu|asia)[a-zA-Z0-9|-]*",module.ccm_composer.composer_bucket)

    depends_on = [module.ccm_composer]
}