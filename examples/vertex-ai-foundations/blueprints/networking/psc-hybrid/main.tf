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
  prefix = coalesce(var.prefix, "") == "" ? "" : "${var.prefix}-"
  project_id = (
    var.project_create
    ? module.project.project_id
    : var.project_id
  )
  vpc_producer_id = (
    var.vpc_create
    ? module.vpc_producer.network.id
    : var.vpc_config["producer"]["id"]
  )
  vpc_producer_main = (
    var.vpc_create
    ? module.vpc_producer.subnets["${var.region}/${var.prefix}-main"].id
    : var.vpc_config["producer"]["subnet_main_id"]
  )
  vpc_producer_proxy = (
    var.vpc_create
    ? module.vpc_producer.subnets_proxy_only["${var.region}/${var.prefix}-proxy"].id
    : var.vpc_config["producer"]["subnet_proxy_id"]
  )
  vpc_producer_psc = (
    var.vpc_create
    ? module.vpc_producer.subnets_psc["${var.region}/${var.prefix}-psc"].id
    : var.vpc_config["producer"]["subnet_psc_id"]
  )
  vpc_consumer_id = (
    var.vpc_create
    ? module.vpc_consumer.network.id
    : var.vpc_config["consumer"]["id"]
  )
  vpc_consumer_main = (
    var.vpc_create
    ? module.vpc_consumer.subnets["${var.region}/${var.prefix}-consumer"].id
    : var.vpc_config["consumer"]["subnet_main_id"]
  )
}

module "project" {
  source         = "../../../modules/project"
  name           = var.project_id
  project_create = var.project_create
  services = [
    "compute.googleapis.com"
  ]
}

# Producer
module "vpc_producer" {
  source     = "../../../modules/net-vpc"
  project_id = local.project_id
  name       = "${local.prefix}producer"
  subnets = [
    {
      ip_cidr_range      = var.producer["subnet_main"]
      name               = "${var.prefix}-main"
      region             = var.region
      secondary_ip_range = {}
    }
  ]
  subnets_proxy_only = [
    {
      ip_cidr_range = var.producer["subnet_proxy"]
      name          = "${local.prefix}proxy"
      region        = var.region
      active        = true
    }
  ]
  subnets_psc = [
    {
      ip_cidr_range = var.producer["subnet_psc"]
      name          = "${local.prefix}psc"
      region        = var.region
    }
  ]
}

module "psc_producer" {
  source          = "./psc-producer"
  project_id      = local.project_id
  name            = var.prefix
  dest_ip_address = var.dest_ip_address
  dest_port       = var.dest_port
  network         = local.vpc_producer_id
  region          = var.region
  zone            = var.zone
  subnet          = local.vpc_producer_main
  subnet_proxy    = local.vpc_producer_proxy
  subnets_psc = [
    local.vpc_producer_psc
  ]
  accepted_limits = var.producer["accepted_limits"]
}

# Consumer

module "vpc_consumer" {
  source     = "../../../modules/net-vpc"
  project_id = local.project_id
  name       = "${local.prefix}consumer"
  subnets = [
    {
      ip_cidr_range      = var.subnet_consumer
      name               = "${local.prefix}consumer"
      region             = var.region
      secondary_ip_range = {}
    }
  ]
}

module "psc_consumer" {
  source     = "./psc-consumer"
  project_id = local.project_id
  name       = "${local.prefix}consumer"
  region     = var.region
  network    = local.vpc_consumer_id
  subnet     = local.vpc_consumer_main
  sa_id      = module.psc_producer.service_attachment.id
}
