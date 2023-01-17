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


variable "name" {
  description = "The resource name of the Endpoint. The name must be numeric with no leading zeros and can be at most 10 digits."
  type = string
}

variable "vpc_network" {
  description = "Object containing vpc related information."
  type = object({
    id = string
    full_name = string
  })
}

variable "display_name" {
    description = "The display name of the Endpoint. The name can be up to 128 characters long and can consist of any UTF-8 characters."
    type = string
}

variable "description" {
    description = "The description of the Endpoint."
    type = string
}

variable "location" {
    description = "The location for the resource"
    type = string
}

variable "labels" {
    description = "Dataset labels."
    type = map(string)
    default = {}
}

variable "encryption_key" {
    description = "Customer-managed encryption key spec for an Endpoint. If set, this Endpoint and all sub-resources of this Endpoint will be secured by this key."
}

variable "address_range" {
    description = "The IP address or beginning of the address range represented by this resource. This can be supplied as an input to reserve a specific address or omitted to allow GCP to choose a valid one for you."
    type =  string
}

variable "prefix_length" {
    description = "The prefix length of the IP range. If not present, it means the address field is a single IP address."
    type = number
}

variable "global_address_name" {
    description = "The name of the global address that will be allocated to the endpoint."
    type = string 
}

variable "kms_service_account" {
    description = "The service account that will be used to access the customer managed key"
    type = list
}