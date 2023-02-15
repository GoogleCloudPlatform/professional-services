/**
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

locals {
  prefix = (var.prefix == null || var.prefix == "") ? "" : "${var.prefix}-"
}

module "project" {
  source = "../../../modules/project"
  billing_account = (var.project_create != null
    ? var.project_create.billing_account_id
    : null
  )
  parent = (var.project_create != null
    ? var.project_create.parent
    : null
  )
  prefix = var.project_create == null ? null : var.prefix
  name   = var.project_id
  services = [
    "compute.googleapis.com"
  ]
  project_create = var.project_create != null
}


module "vpc" {
  source     = "../../../modules/net-vpc"
  project_id = module.project.project_id
  name       = "${local.prefix}vpc"
  subnets = [
    {
      ip_cidr_range = "10.0.1.0/24"
      name          = "subnet-ew1"
      region        = "europe-west1"
    },
    {
      ip_cidr_range = "10.0.2.0/24"
      name          = "subnet-ue1"
      region        = "us-east1"
    },
    {
      ip_cidr_range = "10.0.3.0/24"
      name          = "subnet-uw1"
      region        = "us-west1"
    }
  ]
}

module "firewall" {
  source     = "../../../modules/net-vpc-firewall"
  project_id = module.project.project_id
  network    = module.vpc.name
}

module "nat_ew1" {
  source         = "../../../modules/net-cloudnat"
  project_id     = module.project.project_id
  region         = "europe-west1"
  name           = "${local.prefix}nat-eu1"
  router_network = module.vpc.name
}

module "nat_ue1" {
  source         = "../../../modules/net-cloudnat"
  project_id     = module.project.project_id
  region         = "us-east1"
  name           = "${local.prefix}nat-ue1"
  router_network = module.vpc.name
}

module "instance_template_ew1" {
  source        = "../../../modules/compute-vm"
  project_id    = module.project.project_id
  zone          = "europe-west1-b"
  name          = "${local.prefix}europe-west1-template"
  instance_type = "n1-standard-2"
  network_interfaces = [{
    network    = module.vpc.self_link
    subnetwork = module.vpc.subnet_self_links["europe-west1/subnet-ew1"]
  }]
  boot_disk = {
    image = "projects/debian-cloud/global/images/family/debian-11"
  }
  metadata = {
    startup-script-url = "gs://cloud-training/gcpnet/httplb/startup.sh"
  }
  create_template = true
  tags = [
    "http-server"
  ]
}

module "instance_template_ue1" {
  source     = "../../../modules/compute-vm"
  project_id = module.project.project_id
  zone       = "us-east1-b"
  name       = "${local.prefix}us-east1-template"
  network_interfaces = [{
    network    = module.vpc.self_link
    subnetwork = module.vpc.subnet_self_links["us-east1/subnet-ue1"]
  }]
  boot_disk = {
    image = "projects/debian-cloud/global/images/family/debian-11"
  }
  metadata = {
    startup-script-url = "gs://cloud-training/gcpnet/httplb/startup.sh"
  }
  create_template = true
  tags = [
    "http-server"
  ]
}

module "vm_siege" {
  source        = "../../../modules/compute-vm"
  project_id    = module.project.project_id
  zone          = "us-west1-c"
  name          = "siege-vm"
  instance_type = "n1-standard-2"
  network_interfaces = [{
    network    = module.vpc.self_link
    subnetwork = module.vpc.subnet_self_links["us-west1/subnet-uw1"]
    nat        = true
  }]
  boot_disk = {
    image = "projects/debian-cloud/global/images/family/debian-11"
  }
  metadata = {
    startup-script = <<EOT
    #!/bin/bash

    apt update -y
    apt install -y siege
    EOT
  }
  tags = [
    "ssh"
  ]
}

module "mig_ew1" {
  source            = "../../../modules/compute-mig"
  project_id        = module.project.project_id
  location          = "europe-west1"
  name              = "${local.prefix}europe-west1-mig"
  instance_template = module.instance_template_ew1.template.self_link
  autoscaler_config = {
    max_replicas    = 5
    min_replicas    = 1
    cooldown_period = 45
    scaling_signals = {
      cpu_utilization = {
        target = 0.65
      }
    }
  }
  named_ports = {
    http = 80
  }
  depends_on = [
    module.nat_ew1
  ]
}

module "mig_ue1" {
  source            = "../../../modules/compute-mig"
  project_id        = module.project.project_id
  location          = "us-east1"
  name              = "${local.prefix}us-east1-mig"
  instance_template = module.instance_template_ue1.template.self_link
  autoscaler_config = {
    max_replicas    = 5
    min_replicas    = 1
    cooldown_period = 45
    scaling_signals = {
      cpu_utilization = {
        target = 0.65
      }
    }
  }
  named_ports = {
    http = 80
  }
  depends_on = [
    module.nat_ue1
  ]
}

module "glb" {
  source     = "../../../modules/net-glb"
  name       = "${local.prefix}http-lb"
  project_id = module.project.project_id
  backend_services_config = {
    http-backend = {
      bucket_config = null
      enable_cdn    = false
      cdn_config    = null
      group_config = {
        backends = [
          {
            group   = module.mig_ew1.group_manager.instance_group
            options = null
          },
          {
            group   = module.mig_ue1.group_manager.instance_group
            options = null
          }
        ],
        health_checks = ["hc"]
        log_config = {
          enable      = true
          sample_rate = 1
        }
        options = {
          affinity_cookie_ttl_sec         = null
          custom_request_headers          = null
          custom_response_headers         = null
          connection_draining_timeout_sec = null
          load_balancing_scheme           = null
          locality_lb_policy              = null
          port_name                       = "http"
          security_policy                 = try(google_compute_security_policy.policy[0].name, null)
          session_affinity                = null
          timeout_sec                     = null
          circuits_breakers               = null
          consistent_hash                 = null
          iap                             = null
          protocol                        = "HTTP"
        }
      }
    }
  }
  health_checks_config = {
    hc = {
      type    = "http"
      logging = true
      options = null
      check = {
        port_name          = "http"
        port_specification = "USE_NAMED_PORT"
      }
    }
  }
}

resource "google_compute_security_policy" "policy" {
  count   = var.enforce_security_policy ? 1 : 0
  name    = "${local.prefix}denylist-siege"
  project = module.project.project_id
  rule {
    action   = "deny(403)"
    priority = "1000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = [module.vm_siege.external_ip]
      }
    }
    description = "Deny access to siege VM IP"
  }
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "default rule"
  }
}
