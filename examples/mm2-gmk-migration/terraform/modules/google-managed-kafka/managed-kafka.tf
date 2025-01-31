# ------------------------------------------------------------------------------
# Create a Google Managed Kafka Cluster with Topic
# https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/managed_kafka_cluster
# https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/managed_kafka_topic
# ------------------------------------------------------------------------------

resource "google_managed_kafka_cluster" "cluster" {
  cluster_id = var.name
  location = var.region
  capacity_config {
    # between 3 and 15 The number must also be a multiple of 3
    vcpu_count = var.vcpu_count
    # between 1 GiB and 8 GiB per vCPU
    memory_bytes = var.memory_bytes
  }
  gcp_config {
    access_config {
      network_configs {
        subnet = "projects/${data.google_project.project.number}/regions/us-central1/subnetworks/default"
      }
    }
    kms_key = google_kms_crypto_key.key.id
  }

  rebalance_config {
    mode = var.rebalance_config
  }
  labels = {
    env = "development"
  }

  provider = google-beta
}

resource "google_project_service_identity" "kafka_service_identity" {
  project  = data.google_project.project.project_id
  service  = "managedkafka.googleapis.com"

  provider = google-beta
}

resource "google_kms_crypto_key" "key" {
  name     = "${var.name}-key"
  key_ring = google_kms_key_ring.key_ring.id

  provider = google-beta
}

resource "google_kms_key_ring" "key_ring" {
  name     = "${var.name}-key-ring"
  location = "us-central1"

  provider = google-beta
}

resource "google_kms_crypto_key_iam_binding" "crypto_key_binding" {
  crypto_key_id = google_kms_crypto_key.key.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"

  members = [
    "serviceAccount:service-${data.google_project.project.number}@gcp-sa-managedkafka.iam.gserviceaccount.com",
  ]

  provider = google-beta
}

resource "google_managed_kafka_topic" "example-topic" {
  topic_id = var.kafka_topic_id
  cluster = google_managed_kafka_cluster.cluster.cluster_id
  location = var.region
  partition_count = var.kafka_topic_partition_count
  replication_factor = var.kafka_topic_replication_factor
  configs = {
    "cleanup.policy" = var.kafka_topic_cleanup_policy
    "retention.ms"   = var.kafka_topic_retention_ms
  }

  provider = google-beta
}

data "google_project" "project" {
  provider = google-beta
}