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
  default = "sshsergey-main"
}

variable "location" {
  type = string
  default = "europe-west3"
}

variable "ca_pool_name" {
  type = string
  default = "cas-pool"
}

variable "ca_pool_location" {
  type = string
  default = "europe-west3"
}

variable "domain" {
  type = string
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
