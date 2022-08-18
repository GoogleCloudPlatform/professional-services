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
        # bucket  = ""
        prefix  = "terraform_setup/state"
    }
}

module "ccm_base" {
    source = "../modules/ccm-base"

    project_id              = var.project_id
    project_number          = var.project_number
    region                  = var.region
    zone                    = var.zone

    bigquery = {
        location        = var.bigquery_location
        final_dataset_iam_members = [
            {
                role        = "roles/bigquery.dataEditor"
                member      = "serviceAccount:${module.ccm_base.ccm_service_account}"
            }
        ]
        staging_dataset_iam_members = [
            {
                role        = "roles/bigquery.dataEditor"
                member      = "serviceAccount:${module.ccm_base.ccm_service_account}"
            }
        ]
    }
    ccm-trigger-pubsub-topic = var.ccm-trigger-pubsub-topic
    ccm-delete-pubsub-topic = var.ccm-delete-pubsub-topic
    ccm-scheduler-trigger-name = var.ccm-scheduler-trigger-name
    ccm-scheduler-trigger-frecuency = var.ccm-scheduler-trigger-frecuency
}