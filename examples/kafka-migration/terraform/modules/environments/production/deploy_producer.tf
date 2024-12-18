module "kafka-producer" {
  source = "../../../modules/kafka-producer"
  project_id = "mbawa-sandbox"
  region = "us-central1"
  zone = "us-central1-a"
  image = "debian-cloud/debian-11"
  name = "kafka-producer"
  shared_vpc_name = ""
  shared_vpc_subnetwork = ""
  service_account_email = ""
}