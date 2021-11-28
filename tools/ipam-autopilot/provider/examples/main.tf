terraform {
  required_providers {
    ipam = {
      version = "0.6"
      source = "github.com/cgrotz/ipam"
    }
  }
}

provider "ipam" {
  url = "http://localhost:8080"
}

resource "ipam_ip_range" "pod-ranges" {

  range_size = "22"
  name = "gke services range"
}

output "range" {
  value = ipam_ip_range.pod-ranges.cidr
}