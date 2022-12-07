#!/bin/sh -e

# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Enable IP forwarding
sysctl -w net.ipv4.ip_forward=1

# Stop ipsec when terminating
_stop_ipsec() {
  echo "Shutting down strongSwan/ipsec..."
  ipsec stop
}
trap _stop_ipsec SIGTERM

# Making the containter to work as a default gateway for LAN_NETWORKS
iptables -t nat -A POSTROUTING -s ${LAN_NETWORKS} -o ${VPN_DEVICE} -m policy --dir out --pol ipsec -j ACCEPT
iptables -t nat -A POSTROUTING -s ${LAN_NETWORKS} -o ${VPN_DEVICE} -j MASQUERADE

# Start ipsec
echo "Starting up strongSwan/ipsec..."
ipsec start --nofork "$@" &
child=$!
wait "$child"
