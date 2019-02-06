module "zookeeper" {
  source = "./zookeeper"

  region                 = "${var.region}"
  zone                   = "${var.zone}"
  network                = "${var.network}"
  bucket_name            = "${var.bucket_name}"
  zookeeper_name         = "${var.zookeeper_name}"
  zookeeper_machine_type = "${var.zookeeper_machine_type}"
  zookeeper_disk         = "${var.zookeeper_disk}"
}

module "cloudsql" {
  source = "./cloudsql"

  project = "${var.project}"
  region  = "${var.region}"

  cloud_sql_instance_name = "${var.cloud_sql_instance_name}"
  database_version        = "${var.database_version}"
  master_instance_name    = "${var.master_instance_name}"
  bucket_name             = "${var.bucket_name}"
  tier                    = "${var.tier}"
  db_name                 = "${var.db_name}"
  user_name               = "${var.user_name}"
  user_host               = "${var.user_host}"
  activation_policy       = "${var.activation_policy}"
  disk_size               = "${var.disk_size}"
  disk_type               = "${var.disk_type}"
  network                 = "${var.network}"
  private_ip_name         = "${var.private_ip_name}"
}

data "template_file" "druid_config" {
  template = "${file("${path.module}/common.runtime.properties")}"

  vars {
    zookeper_ip = "${format("%s:2181,%s:2181,%s:2181", module.zookeeper.zookeeper_ip_list[0], module.zookeeper.zookeeper_ip_list[1], module.zookeeper.zookeeper_ip_list[2])}"
    cloudsql_ip = "${module.cloudsql.instance_address}"
    db_name     = "${var.db_name}"
    username    = "${var.user_name}"
    password    = "${module.cloudsql.sql_password}"
    bucket_name = "${var.bucket_name}"
  }
}

resource "google_storage_bucket_object" "common-properties" {
  name    = "common.runtime.properties"
  content = "${data.template_file.druid_config.rendered}"
  bucket  = "${var.bucket_name}"
}

module "kafka" {
  source = "./kafka"

  region             = "${var.region}"
  zone               = "${var.zone}"
  network            = "${var.network}"
  kafka_name         = "${var.kafka_name}"
  kafka_machine_type = "${var.kafka_machine_type}"
  kafka_disk         = "${var.kafka_disk}"

  zookeeper_ip_ls = "${module.zookeeper.zookeeper_ip_list}"
}

module "dataproc" {
  source = "./dataproc"

  project = "${var.project}"
  region  = "${var.region}"

  bucket_name                       = "${var.bucket_name}"
  dataproc_cluster_name             = "${var.dataproc_cluster_name}"
  dataproc_master_count             = "${var.dataproc_master_count}"
  dataproc_master_machine_type      = "${var.dataproc_master_machine_type}"
  dataproc_master_boot_disk_size_gb = "${var.dataproc_master_boot_disk_size_gb}"
  dataproc_worker_count             = "${var.dataproc_worker_count}"
  dataproc_worker_machine_type      = "${var.dataproc_worker_machine_type}"
  dataproc_worker_boot_disk_size_gb = "${var.dataproc_worker_boot_disk_size_gb}"
}

module "druid_historical" {
  source = "./historical"

  zone  = "${var.zone}"
  count = "${var.historical_node_count}"

  bucket_name                   = "${var.bucket_name}"
  network                       = "${var.network}"
  historical_node_name          = "${var.historical_node_name}"
  druid_historical_machine_type = "${var.druid_historical_machine_type}"
  druid_historical_disk         = "${var.druid_historical_disk}"
  druid_historical_disk_size    = "${var.druid_historical_disk_size}"

  mod_state = "${data.template_file.druid_config.rendered}"
}

module "druid_middlemanager" {
  source = "./middlemanager"

  zone  = "${var.zone}"
  count = "${var.middlemanager_node_count}"

  bucket_name                      = "${var.bucket_name}"
  network                          = "${var.network}"
  middlemanager_node_name          = "${var.middlemanager_node_name}"
  druid_middlemanager_machine_type = "${var.druid_middlemanager_machine_type}"
  druid_middlemanager_disk         = "${var.druid_middlemanager_disk}"
  druid_middlemanager_disk_size    = "${var.druid_middlemanager_disk_size}"

  mod_state = "${data.template_file.druid_config.rendered}"
}

module "druid_broker" {
  source = "./broker"

  zone  = "${var.zone}"
  count = "${var.broker_node_count}"

  bucket_name               = "${var.bucket_name}"
  network                   = "${var.network}"
  broker_node_name          = "${var.broker_node_name}"
  druid_broker_machine_type = "${var.druid_broker_machine_type}"
  druid_broker_disk         = "${var.druid_broker_disk}"
  druid_broker_disk_size    = "${var.druid_broker_disk_size}"

  mod_state = "${data.template_file.druid_config.rendered}"
}

module "druid_coordinator" {
  source = "./coordinator"

  zone  = "${var.zone}"
  count = "${var.coordinator_node_count}"

  bucket_name                    = "${var.bucket_name}"
  network                        = "${var.network}"
  coordinator_node_name          = "${var.coordinator_node_name}"
  druid_coordinator_machine_type = "${var.druid_coordinator_machine_type}"
  druid_coordinator_disk         = "${var.druid_coordinator_disk}"
  druid_coordinator_disk_size    = "${var.druid_coordinator_disk_size}"

  mod_state = "${data.template_file.druid_config.rendered}"
}

module "druid_overlord" {
  source = "./overlord"

  zone  = "${var.zone}"
  count = "${var.overlord_node_count}"

  bucket_name                 = "${var.bucket_name}"
  network                     = "${var.network}"
  overlord_node_name          = "${var.overlord_node_name}"
  druid_overlord_machine_type = "${var.druid_overlord_machine_type}"
  druid_overlord_disk         = "${var.druid_overlord_disk}"
  druid_overlord_disk_size    = "${var.druid_overlord_disk_size}"

  mod_state = "${data.template_file.druid_config.rendered}"
}

module "druid_router" {
  source = "./router"

  zone  = "${var.zone}"
  count = "${var.router_node_count}"

  bucket_name               = "${var.bucket_name}"
  network                   = "${var.network}"
  router_node_name          = "${var.router_node_name}"
  druid_router_machine_type = "${var.druid_router_machine_type}"
  druid_router_disk         = "${var.druid_router_disk}"
  druid_router_disk_size    = "${var.druid_router_disk_size}"

  mod_state = "${data.template_file.druid_config.rendered}"
}

resource "google_compute_firewall" "druid_firewall" {
  name    = "allow-druid-gui"
  network = "${var.network}"

  allow {
    protocol = "tcp"
    ports    = ["8081", "8082", "8083", "8090", "8091"]
  }

  target_tags   = ["druid"]
  source_ranges = ["0.0.0.0/0"]
}
