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

module "consul_cluster" {
    source = "./consul-cluster"

    # Specify either the Google Image "family" or a specific Google Image. You should build this using the scripts
    # in the install-consul module.
    source_image = var.consul_source_image

    # Consul cluster configuration
    cluster_name = "consul-cluster"
    cluster_size = 3
    cluster_tag_name = "consul-cluster"
    machine_type = "n1-standard-1"

    # Tags to allow internal VMs to access the cluster
    allowed_inbound_tags_http_api = ["consul-client", "consul-cluster"]
    allowed_inbound_tags_dns = ["consul-client", "consul-cluster"]
    assign_public_ip_addresses = false

    gcp_project_id = var.gcp_project_id
    gcp_region = var.gcp_region

    # Configure and start Consul during boot. It will automatically form a cluster with all nodes that have that
    # same tag.
    startup_script = <<-EOF
        #!/bin/bash
        /opt/consul/bin/run-consul --server --cluster-tag-name consul-cluster
        nft add rule clouddns postrouting ip saddr \$(curl -s -HMetadata-Flavor:Google metadata/computeMetadata/v1/instance/network-interfaces/0/ip) udp sport 53 ip daddr 35.199.192.0/19 ip saddr set 10.0.0.5 #change this ip whenever static ip changed
        EOF

    # Configure and start Consul during boot. It will automatically form a cluster with all nodes that have that
    # same tag.
    # Ensure the Consul node correctly leaves the cluster when the instance restarts or terminates.
    shutdown_script = <<-EOF
        #!/bin/bash
        /opt/consul/bin/consul leave
        EOF

    # update the one ip from internal subnet range.
    static_ip_address = var.consul_static_ip_address
    static_ip_name = var.consul_static_ip_name
}