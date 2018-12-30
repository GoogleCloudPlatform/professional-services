#!/bin/bash
# Copyright 2018 Google LLC
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

# set some variables:
export GOOGLE_PROJECT=$(gcloud config get-value project)
export MY_PUBLIC_IPV4=$(curl https://api.ipify.org)

# create our variables file:
cat - > terraform.tfvars <<EOF

# project properties
project="${GOOGLE_PROJECT}"
name="${GOOGLE_PROJECT}"
region="us-west2"

# custom network properties
network_name="${GOOGLE_PROJECT}-net"
ip_cidr_range="172.16.0.0/28"
pods_ip_cidr_range="10.40.0.0/14"
services_ip_cidr_range="10.0.16.0/20"

# GKE cluster properties:
node_config_svc_account="k8s-nodes-gke"
daily_maintenance_window_start_time="08:00"
master_ipv4_cidr_block="192.168.0.0/28"
zone="us-west2-a"
additional_zones = [
  "us-west2-b",
  "us-west2-c",
]

# bastion host properties
bastion_image="projects/cis-public/global/images/cis-ubuntu-linux-1804-level-1-v1-0-0-0" # CIS hardened image
bastion_svc_account="bastion-gke"
ssh_source_ranges=["${MY_PUBLIC_IPV4}/32"]
  
EOF
