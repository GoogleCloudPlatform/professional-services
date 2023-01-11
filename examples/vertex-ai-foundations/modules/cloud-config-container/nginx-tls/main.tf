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

locals {
  default_files = {
    "/var/run/nginx/customize.sh" = {
      content     = file("${path.module}/files/customize.sh")
      owner       = "root"
      permissions = "0744"
    }
    "/etc/nginx/conf.d/default.conf" = {
      content     = file("${path.module}/files/default.conf")
      owner       = "root"
      permissions = "0644"
    }
  }
  files = var.files != null ? merge(local.default_files, var.files) : local.default_files
}

module "cos-envoy-td" {
  source = "../cos-generic-metadata"

  authenticate_gcr = true
  users = concat([
    {
      username = "nginx"
      uid      = 2000
    }
  ], var.users)
  run_as_first_user = false

  boot_commands = [
    "systemctl start node-problem-detector",
  ]

  container_image = var.nginx_image
  container_name  = "nginx"
  container_args  = ""

  container_volumes = [
    { host = "/etc/nginx/conf.d", container = "/etc/nginx/conf.d" },
    { host = "/etc/ssl", container = "/etc/ssl" },
  ]

  docker_args = "--network host --pid host"

  files = local.files

  gcp_logging = var.docker_logging

  run_commands = concat(var.runcmd_pre, [
    "iptables -I INPUT 1 -p tcp -m tcp --dport 80 -m state --state NEW,ESTABLISHED -j ACCEPT",
    "iptables -I INPUT 1 -p tcp -m tcp --dport 443 -m state --state NEW,ESTABLISHED -j ACCEPT",
    "/var/run/nginx/customize.sh",
    "systemctl daemon-reload",
    "systemctl start nginx",
  ], var.runcmd_post)

}
