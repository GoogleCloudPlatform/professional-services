resource "google_apigee_instance" "apigee_instance" {
  name                     = "apigee-x-inst-331014"
  location                 = "us-central1"
  description              = "Terraform-provisioned Apigee Runtime Instance"
  org_id                   = "organizations/apigee-x-project-331014"
  disk_encryption_key_name = google_kms_crypto_key.apigee_key.id
  peering_cidr_range       = "SLASH_${var.cidr_mask}"
}

resource "google_apigee_environment" "apigee_env" {
  org_id = "organizations/apigee-x-project-331014"
  name   = "apigee-tf-demo-env"
}

resource "google_apigee_instance_attachment" "env_to_instance_attachment" {
  instance_id = google_apigee_instance.apigee_instance.id 
  environment = google_apigee_environment.apigee_env.name
}

resource "google_apigee_envgroup" "apigee_envgroup" {
  org_id   = "organizations/apigee-x-project-331014"
  name     = "apigee-x-demo-envgroup"
  hostnames = [local.apigee_hostname]
}

resource "google_apigee_envgroup_attachment" "env_to_envgroup_attachment" {
  envgroup_id = google_apigee_envgroup.apigee_envgroup.id
  environment = google_apigee_environment.apigee_env.name
}

