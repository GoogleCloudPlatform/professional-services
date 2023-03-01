# Copyright 2023 Google LLC All Rights Reserved.
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

resource "shell_script" "node_pool" {
  lifecycle_commands {
    create = file("${path.module}/scripts/create.sh")
    read = file("${path.module}/scripts/read.sh")
    update = file("${path.module}/scripts/update.sh")
    delete = file("${path.module}/scripts/delete.sh")
  }

  environment = {
    POOL_NAME = var.pool-name
    PROJECT_ID = var.project-id
    LOCATION = var.location
    CLUSTER_NAME = var.cluster-name
    NODE_LOCATION = var.node-location
    NODE_COUNT = var.node-count
  }
}
