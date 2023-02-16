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

variable "automation" {
  # tfdoc:variable:source 00-bootstrap
  description = "Automation resources created by the bootstrap stage."
  type = object({
    outputs_bucket = string
  })
}

variable "billing_account" {
  # tfdoc:variable:source 00-bootstrap
  description = "Billing account id and organization id ('nnnnnnnn' or null)."
  type = object({
    id              = string
    organization_id = number
  })
}

variable "custom_adv" {
  description = "Custom advertisement definitions in name => range format."
  type        = map(string)
  default = {
    cloud_dns             = "35.199.192.0/19"
#    gcp_all               = "10.128.0.0/16"
#    gcp_dev               = "10.128.32.0/19"
#    gcp_landing           = "10.128.0.0/19"
#    gcp_prod              = "10.128.64.0/19"
    googleapis_private    = "199.36.153.8/30"
    googleapis_restricted = "199.36.153.4/30"
    rfc_1918_10           = "10.0.0.0/8"
    rfc_1918_172          = "172.16.0.0/12"
    rfc_1918_192          = "192.168.0.0/16"
  }
}

variable "custom_roles" {
  # tfdoc:variable:source 00-bootstrap
  description = "Custom roles defined at the org level, in key => id format."
  type = object({
    service_project_network_admin = string
  })
  default = null
}

variable "data_dir" {
  description = "Relative path for the folder storing configuration data for network resources."
  type        = string
  default     = "data"
}

variable "dns" {
  description = "Onprem DNS resolvers."
  type        = map(list(string))
  default = {
    onprem = ["10.0.200.3"]
  }
}

variable "folder_ids" {
  # tfdoc:variable:source 01-resman
  description = "Folders to be used for the networking resources in folders/nnnnnnnnnnn format. If null, folder will be created."
  type = object({
    networking      = string
    networking-dev  = string
    networking-prod = string
  })
}

variable "l7ilb_subnets" {
  description = "Subnets used for L7 ILBs."
  type = map(list(object({
    ip_cidr_range = string
    region        = string
  })))
  default = {
    prod = [
      { ip_cidr_range = "10.128.92.0/24", region = "europe-west1" },
      { ip_cidr_range = "10.128.93.0/24", region = "europe-west4" }
    ]
    dev = [
      { ip_cidr_range = "10.128.60.0/24", region = "europe-west1" },
      { ip_cidr_range = "10.128.61.0/24", region = "europe-west4" }
    ]
  }
}

variable "organization" {
  # tfdoc:variable:source 00-bootstrap
  description = "Organization details."
  type = object({
    domain      = string
    id          = number
    customer_id = string
  })
}

variable "outputs_location" {
  description = "Path where providers and tfvars files for the following stages are written. Leave empty to disable."
  type        = string
  default     = null
}

variable "prefix" {
  # tfdoc:variable:source 00-bootstrap
  description = "Prefix used for resources that need unique names. Use 9 characters or less."
  type        = string

  validation {
    condition     = try(length(var.prefix), 0) < 10
    error_message = "Use a maximum of 9 characters for prefix."
  }
}

variable "psa_ranges" {
  description = "IP ranges used for Private Service Access (e.g. CloudSQL)."
  type = object({
    dev = object({
      ranges = map(string)
      routes = object({
        export = bool
        import = bool
      })
    })
    prod = object({
      ranges = map(string)
      routes = object({
        export = bool
        import = bool
      })
    })
  })
  default = null
  # default = {
  #   dev = {
  #     ranges = {
  #       cloudsql-mysql     = "10.128.62.0/24"
  #       cloudsql-sqlserver = "10.128.63.0/24"
  #     }
  #     routes = null
  #   }
  #   prod = {
  #     ranges = {
  #       cloudsql-mysql     = "10.128.94.0/24"
  #       cloudsql-sqlserver = "10.128.95.0/24"
  #     }
  #     routes = null
  #   }
  # }
}

variable "region_trigram" {
  description = "Short names for GCP regions."
  type        = map(string)
  default = {
    europe-west1 = "ew1"
    europe-west3 = "ew3"
  }
}

variable "router_onprem_configs" {
  description = "Configurations for routers used for onprem connectivity."
  type = map(object({
    adv = object({
      custom  = list(string)
      default = bool
    })
    asn = number
  }))
  default = {
    landing-ew1 = {
      asn = "65533"
      adv = null
      # adv = { default = false, custom = [] }
    }
  }
}

variable "service_accounts" {
  # tfdoc:variable:source 01-resman
  description = "Automation service accounts in name => email format."
  type = object({
    data-platform-dev    = string
    data-platform-prod   = string
    gke-dev              = string
    gke-prod             = string
    project-factory-dev  = string
    project-factory-prod = string
  })
  default = null
}

variable "vpn_onprem_configs" {
  description = "VPN gateway configuration for onprem interconnection."
  type = map(object({
    adv = object({
      default = bool
      custom  = list(string)
    })
    peer_external_gateway = object({
      redundancy_type = string
      interfaces = list(object({
        id         = number
        ip_address = string
      }))
    })
    tunnels = list(object({
      peer_asn                        = number
      peer_external_gateway_interface = number
      secret                          = string
      session_range                   = string
      vpn_gateway_interface           = number
    }))
  }))
  default = {
    landing-ew1 = {
      adv = {
        default = false
        custom = [
          "cloud_dns", "googleapis_private", "googleapis_restricted", "gcp_all"
        ]
      }
      peer_external_gateway = {
        redundancy_type = "SINGLE_IP_INTERNALLY_REDUNDANT"
        interfaces = [
          { id = 0, ip_address = "8.8.8.8" },
        ]
      }
      tunnels = [
        {
          peer_asn                        = 65534
          peer_external_gateway_interface = 0
          secret                          = "foobar"
          session_range                   = "169.254.1.0/30"
          vpn_gateway_interface           = 0
        },
        {
          peer_asn                        = 65534
          peer_external_gateway_interface = 0
          secret                          = "foobar"
          session_range                   = "169.254.1.4/30"
          vpn_gateway_interface           = 1
        }
      ]
    }
  }
}
