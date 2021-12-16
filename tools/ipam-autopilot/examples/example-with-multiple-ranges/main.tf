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

resource "ipam_ip_range" "sub1" {
  range_size = 24
  name = "sub range 1"
  domain = ipam_routing_domain.test.id
  parent = ipam_ip_range.main.cidr
  cidr = "10.0.1.0/24"
}

// Create Range referencing parent via CIDR
resource "ipam_ip_range" "sub1_1" {
  range_size = 26
  name = "sub range 1.1"
  domain = ipam_routing_domain.test.id
  parent = ipam_ip_range.sub1.cidr
}

resource "ipam_ip_range" "sub2" {
  range_size = 8
  name = "sub range 2"
  domain = ipam_routing_domain.test.id
  parent = ipam_ip_range.main.cidr
  cidr = "10.0.2.0/24"
}

// Create Range referencing parent via id
resource "ipam_ip_range" "sub2_1" {
  range_size = 26
  name = "sub range 2.1"
  domain = ipam_routing_domain.test.id
  parent = ipam_ip_range.sub2.id
}
