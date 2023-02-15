# Copyright 2022 Google LLC
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

# tfdoc:file:description Creates SQL admin user password secret.

# Password for cluster user
module "secret-manager" {
  source     = "../../../modules/secret-manager"
  project_id = var.project_id
  secrets = {
    (local.ad_user_password_secret) = null
  }
  versions = {
    (local.ad_user_password_secret) = {
      v1 = { enabled = true, data = var.sql_admin_password }
    }
  }
  iam = {
    (local.ad_user_password_secret) = {
      "roles/secretmanager.secretAccessor" = [module.compute-service-account.iam_email]
    }
  }
}
