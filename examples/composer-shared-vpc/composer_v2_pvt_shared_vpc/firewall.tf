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


data "google_netblock_ip_ranges" "legacy_health_checkers" {
  range_type = "legacy-health-checkers"
}

data "google_netblock_ip_ranges" "health_checkers" {
  range_type = "health-checkers"
}


module "egress-firewall-rules" {
  count        = var.firewall_rules_create ? 1 : 0
  source       = "terraform-google-modules/network/google//modules/firewall-rules"
  project_id   = var.network_project_id
  network_name = var.network

  rules = [
    {
      name        = "fw-${var.composer_env_name}-e-a-nodes-to-ws-tcp-3306-3307"
      description = null
      direction   = "EGRESS"
      priority    = 1000
      log_config = {
        metadata = "INCLUDE_ALL_METADATA"
      }
      allow = [{
        protocol = "tcp"
        ports    = ["3306", "3307"]
      }]
      ranges                  = [var.composer_network_ipv4_cidr]
      target_tags             = var.tags
      source_tags             = null
      source_service_accounts = null
      target_service_accounts = null
      deny                    = []
    },
    {
      name        = "fw-${var.composer_env_name}-e-a-nodes-to-nodes-all-all"
      description = null
      direction   = "EGRESS"
      priority    = 1000
      log_config = {
        metadata = "INCLUDE_ALL_METADATA"
      }
      allow = [{
        protocol = "all"
        ports    = null
      }]
      ranges                  = [local.subnet_primary_cidr_range]
      target_tags             = var.tags
      source_tags             = null
      source_service_accounts = null
      target_service_accounts = null
      deny                    = []
    },
    {
      name        = "fw-${var.composer_env_name}-e-a-nodes-to-pods-all-all"
      description = null
      direction   = "EGRESS"
      priority    = 1000
      log_config = {
        metadata = "INCLUDE_ALL_METADATA"
      }
      allow = [{
        protocol = "all"
        ports    = null
      }]
      ranges                  = [local.subnet_pod_cidr_range]
      target_tags             = var.tags
      source_tags             = null
      source_service_accounts = null
      target_service_accounts = null
      deny                    = []
    },
    {
      name        = "fw-${var.composer_env_name}-e-a-nodes-to-masters-all-all"
      description = null
      direction   = "EGRESS"
      priority    = 1000
      log_config = {
        metadata = "INCLUDE_ALL_METADATA"
      }
      allow = [{
        protocol = "all"
        ports    = null
      }]
      ranges                  = [var.master_ipv4_cidr]
      target_tags             = var.tags
      source_tags             = null
      source_service_accounts = null
      target_service_accounts = null
      deny                    = []
    },
    {
      name        = "fw-${var.composer_env_name}-e-a-nodes-to-services-tcp-ssl-sql-redis"
      description = null
      direction   = "EGRESS"
      priority    = 1000
      log_config = {
        metadata = "INCLUDE_ALL_METADATA"
      }
      allow = [{
        protocol = "tcp"
        ports    = ["3306", "6379", "443"]
      }]
      ranges                  = [local.subnet_svc_cidr_range]
      target_tags             = var.tags
      source_tags             = null
      source_service_accounts = null
      target_service_accounts = null
      deny                    = []
    },
    {
      name        = "fw-${var.composer_env_name}-e-a-nodes-to-lb-tcp-80-443"
      description = null
      direction   = "EGRESS"
      priority    = 1000

      log_config = {
        metadata = "INCLUDE_ALL_METADATA"
      }

      allow = [{
        protocol = "tcp"
        ports    = ["80", "443"]
      }]
      ranges                  = concat(data.google_netblock_ip_ranges.health_checkers.cidr_blocks_ipv4, data.google_netblock_ip_ranges.legacy_health_checkers.cidr_blocks_ipv4)
      target_tags             = var.tags
      source_tags             = null
      source_service_accounts = null
      target_service_accounts = null
      deny                    = []
    },
    {
      name        = "fw-${var.composer_env_name}-i-a-all-lb-to-nodes-tcp-80-443"
      description = null
      direction   = "INGRESS"
      priority    = 1000

      log_config = {
        metadata = "INCLUDE_ALL_METADATA"
      }
      ranges = concat(data.google_netblock_ip_ranges.health_checkers.cidr_blocks_ipv4, data.google_netblock_ip_ranges.legacy_health_checkers.cidr_blocks_ipv4)

      allow = [{
        protocol = "tcp"
        ports    = ["80", "443"]
      }]
      target_tags             = var.tags
      source_tags             = null
      source_service_accounts = null
      target_service_accounts = null
      deny                    = []
    }
  ]
}
