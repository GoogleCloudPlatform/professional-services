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

variable "location1" {
  type = string
}

variable "location2" {
  type = string
}

/* CAS related variables */

variable "root_pool_name" {
  type = string
}

variable "sub_pool1_name" {
  type = string
}

variable "sub_pool2_name" {
  type = string
}

variable "root_ca_name" {
  type = string
}

variable "sub_ca1_name" {
  type = string
}

variable "sub_ca2_name" {
  type = string
}

variable "domain" {
  type = string
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

variable "root_common_name" {
  type = string
  default = "ACME Root CA"
}

variable "subca1_common_name" {
  type = string
  default = "ACME Sub CA1"
}

variable "subca2_common_name" {
  type = string
  default = "ACME Sub CA2"
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

variable "cert_name" {
  type = string
  default = "cert-demo1"
}


/* IAM related variables */

variable "cert_managers" {
  type = list(string)
  default = []
}

variable "cert_requesters" {
  type = list(string)
  default = []
}

variable "workload_cert_requesters" {
  type = list(string)
  default = []
}

variable "cert_auditors" {
  type = list(string)
  default = []
}
