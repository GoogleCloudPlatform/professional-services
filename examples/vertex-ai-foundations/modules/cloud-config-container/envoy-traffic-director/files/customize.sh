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

ENVOY_NODE_ID=$(uuidgen)
ENVOY_ZONE=$(curl -s -H "Metadata-Flavor: Google" http://metadata/computeMetadata/v1/instance/zone | cut -f 4 -d '/')
CONFIG_PROJECT_NUMBER=$(curl -s -H "Metadata-Flavor: Google" http://metadata/computeMetadata/v1/instance/network-interfaces/0/network | cut -f 2 -d '/')
VPC_NETWORK_NAME=$(curl -s -H "Metadata-Flavor: Google" http://metadata/computeMetadata/v1/instance/network-interfaces/0/network | cut -f 4 -d '/')
sed -i "s/ENVOY_NODE_ID/${ENVOY_NODE_ID}/" /etc/envoy/envoy.yaml
sed -i "s/ENVOY_ZONE/${ENVOY_ZONE}/" /etc/envoy/envoy.yaml
sed -i "s/CONFIG_PROJECT_NUMBER/${CONFIG_PROJECT_NUMBER}/" /etc/envoy/envoy.yaml
sed -i "s/VPC_NETWORK_NAME/${VPC_NETWORK_NAME}/" /etc/envoy/envoy.yaml
