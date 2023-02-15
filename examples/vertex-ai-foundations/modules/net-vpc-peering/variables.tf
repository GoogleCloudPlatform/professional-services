/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


variable "export_local_custom_routes" {
  description = "Export custom routes to peer network from local network."
  type        = bool
  default     = false
}

variable "export_peer_custom_routes" {
  description = "Export custom routes to local network from peer network."
  type        = bool
  default     = false
}

variable "local_network" {
  description = "Resource link of the network to add a peering to."
  type        = string
}

variable "peer_create_peering" {
  description = "Create the peering on the remote side. If false, only the peering from this network to the remote network is created."
  type        = bool
  default     = true
}

variable "peer_network" {
  description = "Resource link of the peer network."
  type        = string
}

variable "prefix" {
  description = "Name prefix for the network peerings."
  type        = string
  default     = "network-peering"
}
