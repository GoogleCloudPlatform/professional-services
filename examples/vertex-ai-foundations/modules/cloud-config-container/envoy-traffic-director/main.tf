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

module "cos-envoy-td" {
  source = "../cos-generic-metadata"

  boot_commands = [
    "systemctl start node-problem-detector",
  ]

  container_image = var.envoy_image
  container_name  = "envoy"
  container_args  = "-c /etc/envoy/envoy.yaml --log-level info --allow-unknown-static-fields"

  container_volumes = [
    { host = "/etc/envoy/envoy.yaml", container = "/etc/envoy/envoy.yaml" }
  ]

  docker_args = "--network host --pid host"

  files = {
    "/var/run/envoy/customize.sh" = {
      content     = file("${path.module}/files/customize.sh")
      owner       = "root"
      permissions = "0744"
    }
    "/etc/envoy/envoy.yaml" = {
      content     = file("${path.module}/files/envoy.yaml")
      owner       = "root"
      permissions = "0644"
    }
  }

  gcp_logging = var.docker_logging

  run_commands = [
    "iptables -t nat -N ENVOY_IN_REDIRECT",
    "iptables -t nat -A ENVOY_IN_REDIRECT -p tcp -j REDIRECT --to-port 15001",
    "iptables -t nat -A PREROUTING -p tcp -m tcp --dport 80 -j ENVOY_IN_REDIRECT",
    "iptables -t filter -A INPUT -p tcp -m tcp --dport 15001 -m state --state NEW,ESTABLISHED -j ACCEPT",
    "/var/run/envoy/customize.sh",
    "systemctl daemon-reload",
    "systemctl start envoy",
  ]

  users = [
    {
      username = "envoy",
      uid      = 1337
    }
  ]
}
