/**
 * Copyright 2023 Google LLC
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

variable "location" {
  type = string
}

variable "ca_name" {
  type = string
}

variable "domain" {
  type = string
  default = "acme.com"
}

variable "lifetime" {
  type = string
  default = "315400000s"
}

variable "algorithm" {
  type = string
  default = "EC_SIGN_P384_SHA384"
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

variable "ca_pool_name" {
  type = string
  default = "default-pool"
}

variable "crypto_key_id" {
  type = string
  default = ""
}

variable "crypto_key_version" {
  type = number
  default = 1
}

variable "root_ca_id" {
  type = string
  default = ""
}
