// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

terraform {
  required_providers {
    ipam = {
      version = "0.3"
      source = "<cloud_run_host>/ipam-autopilot/ipam"
    }
  }
}

provider "ipam" {
  url = "https://<cloud_run_host>"
}

resource "ipam_routing_domain" "test" {
  name = "Test Domain"
}

resource "ipam_ip_range" "main" {
  range_size = 8
  name = "main range"
  domain = ipam_routing_domain.test.id
  cidr = "10.0.0.0/8"
}

resource "ipam_ip_range" "pod-ranges" {
  range_size = 22
  name = "gke pod range"
  domain = ipam_routing_domain.test.id
  parent = ipam_ip_range.main.cidr
}

resource "ipam_ip_range" "services-ranges" {
  range_size = 22
  name = "gke services range"
  domain = ipam_routing_domain.test.id
  parent = ipam_ip_range.main.cidr
}

output "pod-range" {
  value = ipam_ip_range.pod-ranges.cidr
}