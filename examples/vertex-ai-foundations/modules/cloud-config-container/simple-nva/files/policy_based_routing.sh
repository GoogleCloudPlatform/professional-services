#!/bin/bash

# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

IF_NAME=$1
IP_LB=$(ip r show table local | grep "$IF_NAME proto 66" | cut -f 2 -d " ")

# If there's a load balancer for this IF...
if [ ! -z $IP_LB ] 
then
  IF_NUMBER=$(echo $IF_NAME | sed -e s/eth//)
  IF_GW=$(curl http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/$IF_NUMBER/gateway -H "Metadata-Flavor: Google")
  IF_IP=$(curl http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/$IF_NUMBER/ip -H "Metadata-Flavor: Google")
  IF_NETMASK=$(curl http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/$IF_NUMBER/subnetmask -H "Metadata-Flavor: Google")
  IF_IP_PREFIX=$(/var/run/nva/ipprefix_by_netmask.sh $IF_NETMASK)
  grep -qxF "$((200 + $IF_NUMBER)) hc-$IF_NAME" /etc/iproute2/rt_tables || echo "$((200 + $IF_NUMBER)) hc-$IF_NAME" >>/etc/iproute2/rt_tables
  ip route add $IF_GW src $IF_IP dev $IF_NAME table hc-$IF_NAME
  ip route add default via $IF_GW dev $IF_NAME table hc-$IF_NAME
  ip rule add from $IP_LB/32 table hc-$IF_NAME
fi
