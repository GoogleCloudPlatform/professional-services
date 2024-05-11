# Copyright 2024 Google LLC
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

module "consul-glb" {
  source            = "./consul/consul-glb"
  instance_group_id = var.consul_instance_group_id
  network           = var.consul_network
  subnet            = var.consul_subnetwork
  project_id        = var.project_id
  static_ip         = var.consul_lb_static_ip
}
