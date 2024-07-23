/**
 * Copyright 2024 Google LLC
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

variable "project_id" {
  type = string
}

variable "locations" {
  type = map(object({
    ip_cidr_range = string
  }))
  default = { 
    "europe-west3" = {
      ip_cidr_range = "10.100.0.0/24"
    },
    "us-central1" = {
      ip_cidr_range = "10.102.0.0/24"
    }
  }
}
variable "cloud_run_generation" {
  type = string
  description = "v2 if sample Cloud Run backend is Gen2. Set to v1 for Gen1 Cloud Run backend service."
  default = "v2"
}

/* Network related variables */

variable "vpc_network" {
  type = string
  default = "default"
}

variable "subnet" {
  type = string
  default = "default"
}

/* CAS related variables */

variable "ca_pool_name" {
  type = string
  default = "cas-pool"
}

variable "domain" {
  type = string
  description = "SAN domain name of the server TLS certificate being served by L7 load balancers including the GXLB. Set to the subdomain you control and update your DNS record to point to the IP address of the GXLB created by this project."
  default = "crx.hello.zone"
}

variable "reusable_config" {
  type = string
  default = "root-unconstrained"
}

variable "lifetime" {
  type = string
  default = "315400000s"
}

variable "algorithm" {
  type = string
  default = "RSA_PKCS1_4096_SHA256"
}

variable "tier" {
  type = string
  default = "ENTERPRISE"
}

variable "type" {
  type = string
  default = "SELF_SIGNED"
}

variable "common_name" {
  type = string
  default = "CAS CA"
}

variable "organization_name" {
  type = string
  default = "ACME"
}

variable "country_code" {
  type = string
  default = "DE"
}

variable "locality" {
  type = string
  default = "Cologne"
}

variable "province" {
  type = string
  default = "NRW"
}

variable "organizational_unit" {
  type = string
  default = "BU"
}

variable "image" {
  type = string
}
