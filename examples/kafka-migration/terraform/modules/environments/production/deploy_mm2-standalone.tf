module "mm2-standalone" {
  source = "../../../modules/mirror-maker2-standalone"
  project_id = "mbawa-sandbox"
  region = "us-central1"
  zone = "us-central1-a"
  image = "debian-12-bookworm-v20241112"
  name = "mm2-standalone"
  mm2_count = "1"
  shared_vpc_name = ""
  shared_vpc_subnetwork = ""
  service_account_email = "594537533327-compute@developer.gserviceaccount.com"
  kafka_cluster_src_broker = "bootstrap.kafka-src-new.us-central1.managedkafka.mbawa-sandbox.cloud.goog:9092"
  kafka_cluster_dest_broker = "bootstrap.kafka-dest-new.us-central1.managedkafka.mbawa-sandbox.cloud.goog:9092"
}