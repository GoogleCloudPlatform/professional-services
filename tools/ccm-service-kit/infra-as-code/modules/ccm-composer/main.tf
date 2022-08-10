resource "google_composer_environment" "composer_intance" {
  project = var.project_id
  name    = var.composer.instance_name
  region  = var.region

  config {
    software_config {
      image_version = var.composer.image
      env_variables = var.composer.env_variables
    }

    node_config {
      network         = var.composer.network_id
      subnetwork      = var.composer.subnetwork_id
      service_account = var.composer.service_account
    }

    private_environment_config {
      enable_private_endpoint = var.composer.private_ip
    }

  }
}