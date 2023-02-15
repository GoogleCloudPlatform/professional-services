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
  monitoring_agent_unit   = <<-EOT
    [Unit]
    Description=Start monitoring agent container
    After=gcr-online.target docker.socket
    Wants=gcr-online.target docker.socket docker-events-collector.service

    [Service]
    Environment="HOME=/home/opsagent"
    ExecStartPre=/usr/bin/docker-credential-gcr configure-docker
    ExecStart=/usr/bin/docker run --rm --name=monitoring-agent \
          --log-driver=gcplogs \
          --network host \
          -v /etc/google-cloud-ops-agent/config.yaml:/etc/google-cloud-ops-agent/config.yaml \
          ${var.ops_agent_image}
    ExecStop=/usr/bin/docker stop monitoring-agent
  EOT
  monitoring_agent_config = <<-EOT
    logging:
      service:
        pipelines:
          default_pipeline:
            receivers: []
    metrics:
      receivers:
        hostmetrics:
          type: hostmetrics
        nginx:
          type: nginx
          collection_interval: 10s
          stub_status_url: http://localhost/healthz
      service:
        pipelines:
          default_pipeline:
            receivers:
              - hostmetrics
              - nginx
  EOT
  nginx_config            = <<-EOT
    server {
      listen       80;
      server_name  HOSTNAME localhost;
      %{if var.tls}
      listen       443 ssl;
      ssl_certificate     /etc/ssl/self-signed.crt;
      ssl_certificate_key /etc/ssl/self-signed.key;
      %{endif}

      keepalive_timeout  650s;
      keepalive_requests 10000;

      proxy_connect_timeout 60s;
      proxy_read_timeout    5m;
      proxy_send_timeout    5m;

      error_log stderr;
      access_log /dev/stdout combined;

      set_real_ip_from ${module.xlb.ip_address}/32;
      set_real_ip_from 35.191.0.0/16;
      set_real_ip_from 130.211.0.0/22;
      real_ip_header X-Forwarded-For;
      real_ip_recursive off;

      location /healthz {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        allow 35.191.0.0/16;
        allow 130.211.0.0/22;
        deny all;
      }

      error_page   500 502 503 504  /50x.html;
      location = /50x.html {
        root   /usr/share/nginx/html;
      }

      ${var.backends}
    }
  EOT
  nginx_files = {
    "/etc/systemd/system/monitoring-agent.service" = {
      content     = local.monitoring_agent_unit
      owner       = "root"
      permissions = "0644"
    }
    "/etc/nginx/conf.d/default.conf" = {
      content     = local.nginx_config
      owner       = "root"
      permissions = "0644"
    }
    "/etc/google-cloud-ops-agent/config.yaml" = {
      content     = local.monitoring_agent_config
      owner       = "root"
      permissions = "0644"
    }
  }
  users = [
    {
      username = "opsagent"
      uid      = 2001
    }
  ]
}

module "project" {
  source = "../../../modules/project"
  billing_account = (var.project_create != null
    ? var.project_create.billing_account_id
    : null
  )
  name = var.project_name
  parent = (var.project_create != null
    ? var.project_create.parent
    : null
  )

  services = [
    "cloudresourcemanager.googleapis.com",
    "compute.googleapis.com",
    "iam.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
  ]

  project_create = var.project_create != null
}

module "vpc" {
  source     = "../../../modules/net-vpc"
  project_id = module.project.project_id
  name       = var.network
  subnets = [
    {
      name          = var.subnetwork
      ip_cidr_range = var.cidrs[var.subnetwork]
      region        = var.region
    },
  ]
  vpc_create = var.network_create
}

module "firewall" {
  source     = "../../../modules/net-vpc-firewall"
  project_id = module.project.project_id
  network    = module.vpc.name
  ingress_rules = {
    format("%sallow-http-to-proxy-cluster", var.prefix) = {
      description = "Allow Nginx HTTP(S) ingress traffic"
      source_ranges = [
        var.cidrs[var.subnetwork], "35.191.0.0/16", "130.211.0.0/22"
      ]
      targets              = [module.service-account-proxy.email]
      use_service_accounts = true
      rules                = [{ protocol = "tcp", ports = [80, 443] }]
    }
    format("%sallow-iap-ssh", var.prefix) = {
      description          = "Allow Nginx SSH traffic from IAP"
      source_ranges        = ["35.235.240.0/20"]
      targets              = [module.service-account-proxy.email]
      use_service_accounts = true
      rules                = [{ protocol = "tcp", ports = [22] }]
    }
  }
}

module "nat" {
  source                = "../../../modules/net-cloudnat"
  project_id            = module.project.project_id
  region                = var.region
  name                  = format("%snat", var.prefix)
  router_network        = module.vpc.name
  config_source_subnets = "LIST_OF_SUBNETWORKS"

  logging_filter = "ALL"

  config_min_ports_per_vm = 4000
  subnetworks = [
    {
      self_link            = module.vpc.subnet_self_links[format("%s/%s", var.region, var.subnetwork)]
      config_source_ranges = ["ALL_IP_RANGES"]
      secondary_ranges     = null
    }
  ]
}

###############################################################################
#                               Proxy resources                               #
###############################################################################

module "service-account-proxy" {
  source     = "../../../modules/iam-service-account"
  project_id = module.project.project_id
  name       = format("%sreverse-proxy", var.prefix)
  iam_project_roles = {
    (module.project.project_id) = [
      "roles/logging.logWriter",
      "roles/monitoring.metricWriter",
      "roles/storage.objectViewer", // For pulling the Ops Agent image
    ]
  }
}

module "cos-nginx" {
  count       = !var.tls ? 1 : 0
  source      = "../../../modules/cloud-config-container/nginx"
  image       = var.nginx_image
  files       = local.nginx_files
  users       = local.users
  runcmd_pre  = ["sed -i \"s/HOSTNAME/$${HOSTNAME}/\" /etc/nginx/conf.d/default.conf"]
  runcmd_post = ["systemctl start monitoring-agent"]
}

module "cos-nginx-tls" {
  count       = var.tls ? 1 : 0
  source      = "../../../modules/cloud-config-container/nginx-tls"
  nginx_image = var.nginx_image
  files       = local.nginx_files
  users       = local.users
  runcmd_post = ["systemctl start monitoring-agent"]
}

module "mig-proxy" {
  source     = "../../../modules/compute-mig"
  project_id = module.project.project_id
  location   = var.region
  regional   = true
  name       = format("%sproxy-cluster", var.prefix)
  named_ports = {
    http  = "80"
    https = "443"
  }
  autoscaler_config = var.autoscaling == null ? null : {
    min_replicas                      = var.autoscaling.min_replicas
    max_replicas                      = var.autoscaling.max_replicas
    cooldown_period                   = var.autoscaling.cooldown_period
    cpu_utilization_target            = null
    load_balancing_utilization_target = null
    metric                            = var.autoscaling_metric
  }
  update_policy = {
    instance_redistribution_type = "PROACTIVE"
    max_surge_type               = "fixed"
    max_surge                    = 3
    max_unavailable_type         = null
    max_unavailable              = null
    minimal_action               = "REPLACE"
    min_ready_sec                = 60
    type                         = "PROACTIVE"
  }
  default_version = {
    instance_template = module.proxy-vm.template.self_link
    name              = "proxy-vm"
  }
  health_check_config = {
    type = "http"
    check = {
      port         = 80
      request_path = "/healthz"
    }
    config = {
      check_interval_sec  = 10
      healthy_threshold   = 1
      unhealthy_threshold = 1
      timeout_sec         = 10
    }
    logging = true
  }
  auto_healing_policies = {
    health_check      = module.mig-proxy.health_check.self_link
    initial_delay_sec = 60
  }
}

module "proxy-vm" {
  source        = "../../../modules/compute-vm"
  project_id    = module.project.project_id
  zone          = format("%s-c", var.region)
  name          = "nginx-test-vm"
  instance_type = "e2-standard-2"
  tags          = ["proxy-cluster"]
  network_interfaces = [{
    network    = module.vpc.self_link
    subnetwork = module.vpc.subnet_self_links[format("%s/%s", var.region, var.subnetwork)]
  }]
  boot_disk = {
    image = "projects/cos-cloud/global/images/family/cos-stable"
  }
  create_template = true
  metadata = {
    user-data = !var.tls ? module.cos-nginx.0.cloud_config : module.cos-nginx-tls.0.cloud_config
  }
  service_account        = module.service-account-proxy.email
  service_account_create = false
}

module "xlb" {
  source             = "../../../modules/net-glb"
  name               = format("%sreverse-proxy-xlb", var.prefix)
  project_id         = module.project.project_id
  reserve_ip_address = true
  health_checks_config = {
    format("%sreverse-proxy-hc", var.prefix) = {
      type    = "http"
      logging = false
      options = {
        check_interval_sec  = 10
        healthy_threshold   = 1
        unhealthy_threshold = 1
        timeout_sec         = 10
      }
      check = {
        port_specification = "USE_NAMED_PORT"
        port_name          = "http"
        request_path       = "/healthz"
      }
    }
  }
  backend_services_config = {
    format("%sreverse-proxy-backend", var.prefix) = {
      bucket_config = null
      enable_cdn    = false
      cdn_config    = null
      group_config = {
        backends = [
          {
            group   = module.mig-proxy.group_manager.instance_group
            options = null
          }
        ]
        health_checks = [format("%sreverse-proxy-hc", var.prefix)]
        log_config    = null
        options = {
          affinity_cookie_ttl_sec         = null
          custom_request_headers          = null
          custom_response_headers         = null
          connection_draining_timeout_sec = null
          load_balancing_scheme           = null
          locality_lb_policy              = null
          port_name                       = !var.tls ? "http" : "https"
          protocol                        = !var.tls ? "HTTP" : "HTTPS"
          security_policy                 = null
          session_affinity                = null
          timeout_sec                     = null
          circuits_breakers               = null
          consistent_hash                 = null
          iap                             = null
        }
      }
    }
  }
}
