/**
 * Copyright 2022 Google LLC
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

# tfdoc:file:description Ansible generated files.

resource "local_file" "vars_file" {
  content = templatefile("${path.module}/templates/vars.yaml.tpl", {
    istio_version         = var.istio_version
    region                = var.region
    clusters              = keys(var.clusters_config)
    service_account_email = module.mgmt_server.service_account_email
    project_id            = module.fleet_project.project_id
  })
  filename        = "${path.module}/ansible/vars/vars.yaml"
  file_permission = "0666"
}

resource "local_file" "gssh_file" {
  content = templatefile("${path.module}/templates/gssh.sh.tpl", {
    project_id = var.mgmt_project_id
    zone       = var.mgmt_server_config.zone
  })
  filename        = "${path.module}/ansible/gssh.sh"
  file_permission = "0777"
}
