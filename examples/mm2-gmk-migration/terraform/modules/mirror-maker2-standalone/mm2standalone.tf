/**
 * Copyright 2024 Google LLC
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
// This file creates resources required for MM2 Cluster and corresponding confiuration files

// mm2 prometheus metric enable

resource "google_storage_bucket_object" "kafka_connect_yaml" {
  name   = "kafka-connect.yml"
  bucket = var.mm2-bucket-name
  content = <<EOT
lowercaseOutputName: true
rules:
  - pattern: 'kafka.(.+)<type=app-info, client-id=(.+)><>start-time-ms'
    name: kafka_$1_start_time_seconds
    labels:
      clientId: "$2"
    help: "Kafka $1 JMX metric start time seconds"
    type: GAUGE
    valueFactor: 0.001
  - pattern: 'kafka.(.+)<type=app-info, client-id=(.+)><>(commit-id|version): (.+)'
    name: kafka_$1_$3_info
    value: 1
    labels:
      clientId: "$2"
      $3: "$4"
    help: "Kafka $1 JMX metric info version and commit-id"
    type: GAUGE
  - pattern: kafka.(.+)<type=(.+)-metrics, client-id=(.+), topic=(.+), partition=(.+)><>(.+-total|compression-rate|.+-avg|.+-replica|.+-lag|.+-lead)
    name: kafka_$2_$6
    labels:
      clientId: "$3"
      topic: "$4"
      partition: "$5"
    help: "Kafka $1 JMX metric type $2"
    type: GAUGE
  - pattern: kafka.(.+)<type=(.+)-metrics, client-id=(.+), topic=(.+)><>(.+-total|compression-rate|.+-avg)
    name: kafka_$2_$5
    labels:
      clientId: "$3"
      topic: "$4"
    help: "Kafka $1 JMX metric type $2"
    type: GAUGE
  - pattern: kafka.(.+)<type=(.+)-metrics, client-id=(.+), node-id=(.+)><>(.+-total|.+-avg)
    name: kafka_$2_$5
    labels:
      clientId: "$3"
      nodeId: "$4"
    help: "Kafka $1 JMX metric type $2"
    type: UNTYPED
  - pattern: kafka.(.+)<type=(.+)-metrics, client-id=(.*)><>(.+-total|.+-avg|.+-bytes|.+-count|.+-ratio|.+-age|.+-flight|.+-threads|.+-connectors|.+-tasks|.+-ago)
    name: kafka_$2_$4
    labels:
      clientId: "$3"
    help: "Kafka $1 JMX metric type $2"
    type: GAUGE
  - pattern: 'kafka.connect<type=connector-task-metrics, connector=(.+), task=(.+)><>status: ([a-z-]+)'
    name: kafka_connect_connector_status
    value: 1
    labels:
      connector: "$1"
      task: "$2"
      status: "$3"
    help: "Kafka Connect JMX Connector status"
    type: GAUGE
  - pattern: kafka.connect<type=(.+)-metrics, connector=(.+), task=(.+)><>(.+-total|.+-count|.+-ms|.+-ratio|.+-avg|.+-failures|.+-requests|.+-timestamp|.+-logged|.+-errors|.+-retries|.+-skipped)
    name: kafka_connect_$1_$4
    labels:
      connector: "$2"
      task: "$3"
    help: "Kafka Connect JMX metric type $1"
    type: GAUGE
  - pattern: kafka.connect<type=connect-worker-metrics, connector=(.+)><>([a-z-]+)
    name: kafka_connect_worker_$2
    labels:
      connector: "$1"
    help: "Kafka Connect JMX metric $1"
    type: GAUGE
  - pattern: kafka.connect<type=connect-worker-metrics><>([a-z-]+)
    name: kafka_connect_worker_$1
    help: "Kafka Connect JMX metric worker"
    type: GAUGE
  - pattern: kafka.connect<type=connect-worker-rebalance-metrics><>([a-z-]+)
    name: kafka_connect_worker_rebalance_$1
    help: "Kafka Connect JMX metric rebalance information"
    type: GAUGE
  - pattern: kafka.connect.mirror<type=MirrorSourceConnector, target=(.+), topic=(.+), partition=([0-9]+)><>([a-z-]+)
    name: kafka_connect_mirror_source_connector_$4
    help: Kafka Connect MM2 Source Connector Information
    labels:
      destination: "$1"
      topic: "$2"
      partition: "$3"
    type: GAUGE
  - pattern: kafka.connect.mirror<type=MirrorCheckpointConnector, source=(.+), target=(.+)><>([a-z-]+)
    name: kafka_connect_mirror_checkpoint_connector_$3
    help: Kafka Connect MM2 Checkpoint Connector Information
    labels:
      source: "$1"
      target: "$2"
    type: GAUGE
EOT
}

// MM2 Configurations

resource "google_storage_bucket_object" "mm2prop" {
  name   = "mm2.properties"
  bucket = var.mm2-bucket-name
  content = <<EOT
  clusters = source, target
  source.bootstrap.servers = ${var.kafka_cluster_src_broker}
  target.bootstrap.servers = ${var.kafka_cluster_dest_broker}

  source.security.protocol = SASL_SSL
  source.sasl.mechanism = PLAIN
  source.sasl.jaas.config = org.apache.kafka.common.security.plain.PlainLoginModule required username="svc_account@developer.gserviceaccount.com" password="base64encoded";

  target.security.protocol = SASL_SSL
  target.sasl.mechanism = PLAIN
  target.sasl.jaas.config=org.apache.kafka.common.security.oauthbearer.OAuthBearerLoginModule required;
  target.sasl.jaas.config = org.apache.kafka.common.security.plain.PlainLoginModule required username="svc_account@developer.gserviceaccount.com" password="base64encoded";

  mirrors = source->target

  offset.syncs.topic.replication.factor = 3
  checkpoints.topic.replication.factor = 3
  heartbeats.topic.replication.factor = 3


  source->target.enabled=true

  topics = .*
  groups = .*
  emit.checkpoints.interval.seconds = 10
EOT
}



# ------------------------------------------------------------------------------
# Create a Google Compute Engine and Bootstrap the same
# ------------------------------------------------------------------------------

# resource "google_service_account" "default" {
#   account_id   = "my-custom-sa"
#   display_name = "Custom SA for VM Instance"
# }

resource "google_compute_instance" "mm2-standalone" {
  project      = var.project_id
  name         = var.name
  machine_type = var.machine_type
  zone         = var.zone

  tags = ["gce", "mm2-standalone"]

  boot_disk {
    initialize_params {
      image = var.image
      labels = {
        gce = "mm2-standalone"
      }
    }
  }

  // Local SSD disk
  scratch_disk {
    interface = "NVME"
  }

  network_interface {
    network = "default"

    # access_config {
    #   // Ephemeral public IP
    # }
  }

  metadata = {
    mm2 = "mm2-standalone"
  }

  metadata_startup_script = <<SCRIPT
    #! /bin/bash
    mkdir -p /opt/config
    cd ${var.mm2-path}

    # Download Prometheus JAR
    gcloud storage cp --recursive ${var.mm2-binaries-bucket}/binaries/jmx_prometheus_javaagent-0.13.0.jar ${var.mm2-path}/

    # Download and Extract Kafka
    gcloud storage cp --recursive ${var.mm2-binaries-bucket}/binaries/kafka_2.13-3.7.1.tgz ${var.mm2-path}/
    tar -xzvf kafka_2.13-3.7.1.tgz

    # Download and Extract Java
    gcloud storage cp --recursive ${var.mm2-binaries-bucket}/binaries/openjdk-11.0.2_linux-x64_bin.tar.gz ${var.mm2-path}/
    tar -xzvf openjdk-11.0.2_linux-x64_bin.tar.gz

    # Setup Java Path
    export PATH=$PATH:/opt/jdk-11.0.2/bin/

    # Get mm2 properties file
    gcloud storage cp --recursive ${var.mm2-binaries-bucket}/mm2.properties ${var.mm2-path}/config/

    # Get mm2 prometheus properties file
    gcloud storage cp --recursive ${var.mm2-binaries-bucket}/kafka-connect.yml ${var.mm2-path}/config/

    # Export MM2 Metrics using Prometheus
    export KAFKA_OPTS=-javaagent:/opt/jmx_prometheus_javaagent-0.13.0.jar=3600:/opt/config/kafka-connect.yml

    # Start MirrorMaker2
    ./kafka_2.13-3.7.1/bin/connect-mirror-maker.sh config/mm2.properties

    SCRIPT

  service_account {
    # Google recommends custom service accounts that have cloud-platform scope and permissions granted via IAM Roles.
    email  = var.service_account_email
    # https://cloud.google.com/sdk/gcloud/reference/alpha/compute/instances/set-scopes#--scopes
    scopes = ["storage-ro"]
  }
}
