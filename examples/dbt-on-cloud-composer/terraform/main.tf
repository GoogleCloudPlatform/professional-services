module "composer_project" {
  source          = "https://github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/project?ref=v8.0.0"
  parent          = var.root_node
  billing_account = var.billing_account_id
  prefix          = var.prefix
  name            = var.project_id
  iam_additive = {
    "roles/owner" = var.owners
  }
  # Required for Cloud Composer
  policy_boolean = {
    "constraints/compute.requireOsLogin" = false
  }
  services        = [
    "composer.googleapis.com",
    "sourcerepo.googleapis.com",
    "bigquery.googleapis.com",
    "iamcredentials.googleapis.com"
  ]
}

module "composer_vpc" {
  source     = "https://github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/net-vpc?ref=v8.0.0"
  project_id = module.composer_project.project_id
  name       = "composer-vpc"
  subnets = [{
    ip_cidr_range      = "10.1.0.0/24"
    name               = "default"
    region             = var.region
    secondary_ip_range = {
      pods     = "10.16.0.0/14"
      services = "10.20.0.0/24"
    }
  }]
  subnet_private_access = {
    "subnet" = true
  }
}

module "dbt_bucket" {
  source        = "https://github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/gcs?ref=v8.0.0"
  project_id    = module.composer_project.project_id
  name          = "${module.composer_project.project_id}-dbt-docs"
  location      = var.region
  storage_class = "STANDARD"
  force_destroy = true
}

module "composer_sa" {
  source     = "https://github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/iam-service-account?ref=v5.1.0"
  project_id = module.composer_project.project_id
  name       = "composer-sa"
  iam_project_roles = {
    (module.composer_project.project_id) = [
      "roles/composer.user",
      "roles/composer.worker",
      "roles/logging.logWriter",
      "roles/monitoring.metricWriter",
      "roles/iam.serviceAccountUser"
    ]
  }
  iam = var.owners != null ? { "roles/iam.serviceAccountTokenCreator" = var.owners } : {}
}

module "dbt_sa" {
  source     = "https://github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/iam-service-account?ref=v5.1.0"
  project_id = module.composer_project.project_id
  name       = "dbt-sa"
  iam_project_roles = {
    (module.composer_project.project_id) = [
      "roles/editor",
      "roles/iam.serviceAccountUser",
      "roles/iam.serviceAccountTokenCreator"
    ]
  }
  iam = var.owners != null ? { "roles/iam.serviceAccountTokenCreator" = var.owners } : {}
}

module "composer_firewall" {
  source       = "https://github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/net-vpc-firewall"
  project_id   = module.composer_project.project_id
  network      = module.composer_vpc.name
  admin_ranges = [module.composer_vpc.subnet_ips["${var.region}/default"]]
}

module "composer_nat" {
  source         = "https://github.com/GoogleCloudPlatform/cloud-foundation-fabric//modules/net-cloudnat"
  project_id     = module.composer_project.project_id
  region         = var.region
  name           = "default"
  router_network = module.composer_vpc.self_link
}

# Cloud Composer1 setup
resource "google_composer_environment" "dbt-on-cloud-composer1" {
  name    = "dbt-on-cloud-composer1"
  region  = var.region
  project = module.composer_project.project_id
  config {
    software_config {
      image_version  = var.composer1_image
      python_version = "3"
      env_variables = {
        AIRFLOW_VAR_BIGQUERY_LOCATION = var.region
        AIRFLOW_VAR_RUN_ENVIRONMENT = var.dbt_run_environment
        AIRFLOW_VAR_SOURCE_DATA_PROJECT = var.dbt_source_data_project
       }
    }

    node_config {
      network         = module.composer_vpc.self_link
      subnetwork      = module.composer_vpc.subnet_self_links["${var.region}/default"]
      service_account = module.composer_sa.email
      # If cidr blocks are not set now, the ranges will be generated
      # automatically, and TF will fail in subsequent calls to try to update
      # the secondary ranges in the VPC
      ip_allocation_policy {
        use_ip_aliases           = true
        services_secondary_range_name = "services"
	    cluster_secondary_range_name  = "pods"
      }
    }

    private_environment_config {
      enable_private_endpoint = true
    }
  }
}

# Cloud Composer2 setup
resource "google_composer_environment" "dbt-on-cloud-composer2" {
  name    = "dbt-on-cloud-composer2"
  region  = var.region
  project = module.composer_project.project_id
  config {
    software_config {
      image_version  = var.composer2_image
      env_variables = {
        AIRFLOW_VAR_BIGQUERY_LOCATION = var.region
        AIRFLOW_VAR_RUN_ENVIRONMENT = var.dbt_run_environment
        AIRFLOW_VAR_SOURCE_DATA_PROJECT = var.dbt_source_data_project
       }
    }

    workloads_config {
      scheduler {
        cpu        = 0.5
        memory_gb  = 1.875
        storage_gb = 1
        count      = 1
      }
      web_server {
        cpu        = 0.5
        memory_gb  = 1.875
        storage_gb = 1
      }
      worker {
        cpu = 0.5
        memory_gb  = 1.875
        storage_gb = 1
        min_count  = 1
        max_count  = 3
      }


    }
    environment_size = "ENVIRONMENT_SIZE_SMALL"

    node_config {
      network         = module.composer_vpc.self_link
      subnetwork      = module.composer_vpc.subnet_self_links["${var.region}/default"]
      service_account = module.composer_sa.email
    }

    private_environment_config {
      enable_private_endpoint = true
    }
  }
}