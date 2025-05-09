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
// This file creates resources required for Managed Kafka Connect Cluster and corresponding connector configuration files

data "google_project" "project" {
  provider = google-beta
}

// Create a Google Managed Kafka Connect Cluster

resource "google_managed_kafka_connect_cluster" "mkc_cluster" {
 project = var.project_id
 connect_cluster_id = var.mkc_cluster_name
 kafka_cluster = "projects/${var.project_id}/locations/${var.region}/clusters/${var.mkc_dest_cluster_id}"
 location = var.region
 capacity_config {
   vcpu_count = 12
   memory_bytes = 21474836480
 }
 gcp_config {
   access_config {
     network_configs {
       primary_subnet = "projects/${data.google_project.project.number}/regions/us-central1/subnetworks/default"
      #  additional_subnets = ["${google_compute_subnetwork.vpc_subnet_2.id}"]
       dns_domain_names = ["${var.mkc_dest_cluster_id}.${var.gmk_dst_region}.managedkafka.${var.project_id}.cloud.goog","${var.mkc_src_cluster_id}.${var.gmk_src_region}.managedkafka.${var.project_id}.cloud.goog"]
     }
   }
 }
 labels = {
   key = "value"
 }
#  depends_on = [google_project_service.managedkafka]

 provider = google-beta
}


// Mirror Maker 2 Source Connector
resource "google_managed_kafka_connector" "mm2_source_connector" {
 project = var.project_id
 connector_id = "mm2-source-connector"
 connect_cluster = google_managed_kafka_connect_cluster.mkc_cluster.connect_cluster_id
 location = google_managed_kafka_connect_cluster.mkc_cluster.location
 configs = {
   "connector.class" = "org.apache.kafka.connect.mirror.MirrorSourceConnector"
   "name" = "mm2-source-connector"
   "tasks.max" = "3"
   "topics" = ".*"
   "source.cluster.alias" = "source"
   "target.cluster.alias" = "target"
   "topics.exclude" = "mm2.*\\.internal,.*\\.replica,__.*"
   "source.cluster.bootstrap.servers" = "${var.kafka_cluster_src_broker}"
   "target.cluster.bootstrap.servers" = "${var.kafka_cluster_dest_broker}"
 }
 task_restart_policy {
   minimum_backoff = "60s"
   maximum_backoff = "1800s"
 }
 depends_on = [google_managed_kafka_connect_cluster.mkc_cluster]
  
 provider = google-beta
}


// Mirror Maker 2 Heart Beat Connector

resource "google_managed_kafka_connector" "mm2_hb_connector" {
 project = var.project_id
 connector_id = "mm2-hb-connector"
 connect_cluster = google_managed_kafka_connect_cluster.mkc_cluster.connect_cluster_id
 location = google_managed_kafka_connect_cluster.mkc_cluster.location
 configs = {
   "connector.class" = "org.apache.kafka.connect.mirror.MirrorHeartbeatConnector"
   "name" = "mm2-hb-connector"
   "tasks.max" = "3"
   "source.cluster.alias" = "source"
   "target.cluster.alias" = "target"
   "source.cluster.bootstrap.servers" = "${var.kafka_cluster_src_broker}"
   "target.cluster.bootstrap.servers" = "${var.kafka_cluster_dest_broker}"
 }
 task_restart_policy {
   minimum_backoff = "60s"
   maximum_backoff = "1800s"
 }
 depends_on = [google_managed_kafka_connect_cluster.mkc_cluster]
  
 provider = google-beta
}

// Mirror Maker 2 CheckPoint Connector

resource "google_managed_kafka_connector" "mm2_chkpt_connector" {
 project = var.project_id
 connector_id = "mm2-chkpt-connector"
 connect_cluster = google_managed_kafka_connect_cluster.mkc_cluster.connect_cluster_id
 location = google_managed_kafka_connect_cluster.mkc_cluster.location
 configs = {
   "connector.class" = "org.apache.kafka.connect.mirror.MirrorCheckpointConnector"
   "name" = "mm2-chkpt-connector"
   "tasks.max" = "3"
   "groups" = ".*"
   "source.cluster.alias" = "source"
   "target.cluster.alias" = "target"
   "groups.exclude" = ""
   "source.cluster.bootstrap.servers" = "${var.kafka_cluster_src_broker}"
   "target.cluster.bootstrap.servers" = "${var.kafka_cluster_dest_broker}"
 }
 task_restart_policy {
   minimum_backoff = "60s"
   maximum_backoff = "1800s"
 }
 depends_on = [google_managed_kafka_connect_cluster.mkc_cluster]
  
 provider = google-beta
}
