# Copyright 2024 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

terraform {
  required_version = ">= 1.7.4"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 6.11.2, < 7.0.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 6.11.2, < 7.0.0"
    }
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = ">= 1.22.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.6.3"
    }
  }
}

# When using ADC credentials, you'll need the following configuration for DLP API
provider "google" {
  user_project_override = true
  billing_project       = var.project_id
}

module "project" {
  source         = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/project?ref=daily-2024.11.15"
  name           = var.project_id
  project_create = false
  services = [
    "compute.googleapis.com",
    "dlp.googleapis.com",
    "storage.googleapis.com",
    "cloudscheduler.googleapis.com",
  ]
}

provider "mongodbatlas" {
  public_key  = var.mongodbatlas_public_key
  private_key = var.mongodbatlas_private_key
}

module "vpc" {
  source     = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/net-vpc?ref=daily-2024.11.15"
  project_id = var.vpc_config.network_project != null ? var.vpc_config.network_project : module.project.project_id
  name       = var.vpc_config.network
  subnets = [
    {
      ip_cidr_range = var.vpc_config.subnet_cidr
      name          = var.vpc_config.subnetwork
      region        = var.region
      iam           = {}
    }
  ]
  vpc_create = var.vpc_config.create
}

### MongoDB related resources
resource "mongodbatlas_advanced_cluster" "mongodb-cluster" {
  project_id   = var.mongodbatlas_project_id
  name         = "dlp-mongos"
  cluster_type = "REPLICASET"
  replication_specs {
    region_configs {
      electable_specs {
        instance_size = var.mongodbatlas_instance_type
      }
      provider_name         = var.mongodbatlas_instance_type == "M0" ? "TENANT" : "GCP"
      backing_provider_name = var.mongodbatlas_instance_type == "M0" ? "GCP" : null
      priority              = 7
      region_name           = var.mongodbatlas_region
    }
  }

  depends_on = [mongodbatlas_privatelink_endpoint_service.service.0]
}

resource "random_string" "password" {
  length  = 24
  lower   = true
  upper   = false
  numeric = true
  special = false
}

resource "mongodbatlas_custom_db_role" "role" {
  project_id = var.mongodbatlas_project_id
  role_name  = "dlpChangeStreams"

  actions {
    action = "CHANGE_STREAM"
    resources {
      collection_name = ""
      database_name   = "anyDatabase"
    }
  }

  actions {
    action = "FIND"
    resources {
      collection_name = ""
      database_name   = "anyDatabase"
    }
  }
}

resource "mongodbatlas_database_user" "user" {
  username           = "dlp-mongos"
  password           = random_string.password.result
  project_id         = var.mongodbatlas_project_id
  auth_database_name = "admin"

  roles {
    role_name     = mongodbatlas_custom_db_role.role.role_name
    database_name = "admin"
  }

  roles {
    role_name     = "readAnyDatabase"
    database_name = "admin"
  }

  scopes {
    name = mongodbatlas_advanced_cluster.mongodb-cluster.name
    type = "CLUSTER"
  }
}

# If using public instance, allow access from anywhere
resource "mongodbatlas_project_ip_access_list" "access-list" {
  count      = var.mongodbatlas_instance_type == "M0" ? 1 : 0
  project_id = var.mongodbatlas_project_id
  cidr_block = "0.0.0.0/0"
  comment    = "CIDR block for M0"
}

resource "google_compute_address" "endpoint-address" {
  for_each = var.mongodbatlas_instance_type != "M0" ? toset(mongodbatlas_privatelink_endpoint.endpoint.0.service_attachment_names) : toset([])

  project      = var.vpc_config.network_project != null ? var.vpc_config.network_project : module.project.project_id
  name         = format("dlp-mongos-psc-%d", index(mongodbatlas_privatelink_endpoint.endpoint.0.service_attachment_names, each.key))
  subnetwork   = module.vpc.subnet_ids[format("%s/%s", var.region, var.vpc_config.subnetwork)]
  address_type = "INTERNAL"
  region       = var.region
}

resource "google_compute_forwarding_rule" "forwarding-rule" {
  for_each = var.mongodbatlas_instance_type != "M0" ? toset(mongodbatlas_privatelink_endpoint.endpoint.0.service_attachment_names) : toset([])

  target                = each.value
  project               = google_compute_address.endpoint-address[each.value].project
  region                = google_compute_address.endpoint-address[each.value].region
  name                  = google_compute_address.endpoint-address[each.value].name
  ip_address            = google_compute_address.endpoint-address[each.value].id
  network               = module.vpc.network.name
  load_balancing_scheme = ""
}

resource "mongodbatlas_privatelink_endpoint_service" "service" {
  count = var.mongodbatlas_instance_type != "M0" ? 0 : 1

  project_id          = mongodbatlas_privatelink_endpoint.endpoint.0.project_id
  private_link_id     = mongodbatlas_privatelink_endpoint.endpoint.0.private_link_id
  provider_name       = "GCP"
  endpoint_service_id = module.vpc.network.name
  gcp_project_id      = module.project.project_id

  dynamic "endpoints" {
    for_each = google_compute_address.endpoint-address

    content {
      ip_address    = endpoints.value["address"]
      endpoint_name = google_compute_forwarding_rule.forwarding-rule[endpoints.key].name
    }
  }
}

resource "mongodbatlas_privatelink_endpoint" "endpoint" {
  count         = var.mongodbatlas_instance_type != "M0" ? 0 : 1
  project_id    = var.mongodbatlas_project_id
  provider_name = "GCP"
  region        = var.region
}

### Sensitive Data Protection (aka DLP) resources

# Pub/Sub topic for findings
module "pubsub" {
  source     = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/pubsub?ref=daily-2024.11.15"
  project_id = module.project.project_id
  name       = "dlp-mongos-findings"
  iam        = {}
}

resource "google_data_loss_prevention_inspect_template" "template" {
  parent = format("projects/%s", module.project.project_id)

  description  = "Inspect MongoDB contents"
  display_name = "MongoDB inspection"

  inspect_config {
    info_types {
      name = "EMAIL_ADDRESS"
    }
    info_types {
      name = "PERSON_NAME"
    }
    info_types {
      name = "LAST_NAME"
    }
    info_types {
      name = "PHONE_NUMBER"
    }
    info_types {
      name = "FIRST_NAME"
    }
    # For full reference of InfoTypes available, see: https://cloud.google.com/sensitive-data-protection/docs/infotypes-reference
    info_types {
      name = "FINLAND_NATIONAL_ID_NUMBER"
    }
  }

}
resource "google_data_loss_prevention_job_trigger" "trigger" {
  parent = format("projects/%s", module.project.project_id)

  triggers {
    manual {}
  }

  inspect_job {
    // Despite it saying "template name", it really expects a full path (eg. full ID)
    inspect_template_name = google_data_loss_prevention_inspect_template.template.id
    actions {
      pub_sub {
        topic = module.pubsub.id
      }
      # Unquote this and quote above to send findings to Cloud Security Command Center
      # publish_summary_to_cscc {
      # }
    }
    storage_config {
      hybrid_options {
        description                 = "Hybrid job trigger for MongoDB"
        required_finding_label_keys = []
        labels                      = {}
      }
    }
  }
}

### Supporting resources
module "service-account" {
  source     = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/iam-service-account?ref=daily-2024.11.15"
  project_id = module.project.project_id
  name       = "dlp-mongos"
  iam        = {}
  iam_project_roles = {
    "${module.project.project_id}" = [
      "roles/logging.logWriter",
      "roles/monitoring.metricWriter",
      "roles/dlp.jobTriggersEditor",
      "roles/dlp.jobsEditor",
      "roles/serviceusage.serviceUsageConsumer"
    ]
  }
}

resource "random_string" "bucket-suffix" {
  length  = 8
  lower   = true
  upper   = false
  numeric = true
  special = false
}

# Bucket for storing the state file
module "state-bucket" {
  source     = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/gcs?ref=daily-2024.11.15"
  project_id = module.project.project_id
  prefix     = null
  name       = format("dlp-mongos-%s", random_string.bucket-suffix.result)
  location   = var.region
  versioning = false
  labels     = {}
  iam = {
    "roles/storage.objectAdmin" = [module.service-account.iam_email]
  }
}

### Cloud Function
module "function" {
  source          = "github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/cloud-function-v2?ref=daily-2024.11.15"
  project_id      = module.project.project_id
  region          = var.region
  name            = "dlp-mongos"
  service_account = module.service-account.email

  bucket_name = format("dlp-mongos-cf-%s", random_string.bucket-suffix.result)
  bucket_config = {
    force_destroy = true
    location      = var.region
  }
  bundle_config = {
    path = "${path.module}"
  }

  function_config = {
    entry_point     = "DLPFunctionHTTP",
    runtime         = "go122",
    timeout_seconds = 3600, # 1h timeout, if you increase the function run time, make sure it's under 1 hour as some time is required for housekeeping
    instance_count  = 1,
    cpu             = 1,
    memory_mb       = 256,
  }

  iam = {
    "roles/run.invoker" = [module.service-account.iam_email]
  }

  environment_variables = {
    MONGO_CONNECTION_STRING = var.mongodbatlas_instance_type == "M0" ? mongodbatlas_advanced_cluster.mongodb-cluster.connection_strings[0].standard_srv : mongodbatlas_advanced_cluster.mongodb-cluster.connection_strings[0].private_srv,
    MONGO_USERNAME          = mongodbatlas_database_user.user.username,
    MONGO_PASSWORD          = mongodbatlas_database_user.user.password,
    MONGO_DEPLOYMENTS       = join(",", var.mongodb_deployments),
    MONGO_DATABASES         = join(",", var.mongodb_databases)
    MONGO_COLLECTIONS       = join(",", var.mongodb_collections),
    DLP_TRIGGER_NAME        = google_data_loss_prevention_job_trigger.trigger.id,
    PROJECT_ID              = module.project.project_id,
    STATE_FILE              = format("gs://%s/state.json", module.state-bucket.name)
    RUN_PERIOD              = format("%ds", (var.run_period * 60) - 30) # Leave some time to save things
  }
}

# Run the function on a regular schedule
resource "google_cloud_scheduler_job" "job" {
  project          = module.project.project_id
  region           = var.scheduler_region == null ? var.region : var.scheduler_region
  name             = "dlp-mongos-job"
  description      = "Run DLP function regularly"
  schedule         = format("*/%d * * * *", var.run_period)
  time_zone        = "Europe/Amsterdam"
  attempt_deadline = "1200s"

  retry_config {
    retry_count = 1
  }

  http_target {
    http_method = "GET"
    uri         = module.function.uri

    oidc_token {
      service_account_email = module.service-account.email
    }
  }
}
