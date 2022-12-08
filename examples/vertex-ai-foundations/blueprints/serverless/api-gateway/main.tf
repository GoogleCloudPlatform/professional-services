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
  api_id_prefix        = "api"
  function_name_prefix = "cf-hello"
  specs = { for region in var.regions : region =>
    templatefile("${path.module}/spec.yaml", {
      api_id        = "${local.api_id_prefix}-${region}"
      function_name = "${local.function_name_prefix}-${region}"
      region        = region
      project_id    = var.project_id
    })
  }
  backends = [for region in var.regions : {
    group   = google_compute_region_network_endpoint_group.serverless-negs[region].id
    options = null
    }
  ]
}

module "project" {
  source = "../../../modules/project"
  billing_account = (var.project_create != null
    ? var.project_create.billing_account_id
    : null
  )
  parent = (var.project_create != null
    ? var.project_create.parent
    : null
  )
  name = var.project_id
  services = [
    "apigateway.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudfunctions.googleapis.com",
    "compute.googleapis.com",
    "servicemanagement.googleapis.com",
    "servicecontrol.googleapis.com"
  ]
  project_create = var.project_create != null
}

module "sa" {
  source     = "../../../modules/iam-service-account"
  project_id = module.project.project_id
  name       = "sa-api"
}


module "functions" {
  for_each         = toset(var.regions)
  source           = "../../../modules/cloud-function"
  project_id       = module.project.project_id
  name             = "${local.function_name_prefix}-${each.value}"
  bucket_name      = "bkt-${module.project.project_id}-${each.value}"
  region           = each.value
  ingress_settings = "ALLOW_ALL"
  bucket_config = {
    location             = null
    lifecycle_delete_age = 1
  }
  bundle_config = {
    source_dir  = "${path.module}/function"
    output_path = "${path.module}/bundle.zip"
    excludes    = null
  }
  function_config = {
    entry_point = "helloGET"
    instances   = null
    memory      = null
    runtime     = "nodejs16"
    timeout     = null
  }
  service_account_create = true
  iam = {
    "roles/cloudfunctions.invoker" = [module.sa.iam_email]
  }
}

module "gateways" {
  for_each              = toset(var.regions)
  source                = "../../../modules/api-gateway"
  project_id            = module.project.project_id
  api_id                = "${local.api_id_prefix}-${each.value}"
  region                = each.value
  spec                  = local.specs[each.value]
  service_account_email = module.sa.email
}

module "glb" {
  source     = "../../../modules/net-glb"
  name       = "glb"
  project_id = module.project.project_id
  # This is important as serverless backends require no HCs
  health_checks_config_defaults = null
  reserve_ip_address            = true
  backend_services_config = {
    serverless-backend = {
      bucket_config = null
      enable_cdn    = false
      cdn_config    = null
      group_config = {
        backends = [for region in var.regions : {
          group   = google_compute_region_network_endpoint_group.serverless-negs[region].id
          options = null
          }
        ],
        health_checks = []
        log_config    = null
        options       = null
      }
    }
  }
}

resource "google_compute_region_network_endpoint_group" "serverless-negs" {
  for_each              = toset(var.regions)
  provider              = google-beta
  name                  = "serverless-neg-${module.gateways[each.value].gateway_id}"
  project               = module.project.project_id
  network_endpoint_type = "SERVERLESS"
  region                = each.value
  serverless_deployment {
    platform = "apigateway.googleapis.com"
    resource = module.gateways[each.value].gateway_id
    url_mask = ""
  }
  lifecycle {
    create_before_destroy = true
  }
}
