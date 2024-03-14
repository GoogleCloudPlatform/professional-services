/* Copyright 2023 Google.
This software is provided as-is, without warranty or representation for any use or purpose.
Your use of it is subject to your agreement with Google.
*/

variable "region" {
    type = string
    description = "Region in which the Google Cloud Services should be deployed"
}

variable "project_id" {
    type = string
    description = "Google Cloud Project ID"
}

variable "domain" {
    type = string
    description = "Domain under which the load balancer should be reachable"
  
}