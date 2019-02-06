module "cloudsql" {
  source = "./cloudsql"

  project = "${var.project}"
  region  = "${var.region}"

  cloud_sql_instance_name = "${var.cloud_sql_instance_name}"
  bucket_name             = "${var.bucket_name}"
  tier                    = "${var.tier}"
  activation_policy       = "${var.activation_policy}"
  cloud_sql_disk_size     = "${var.cloud_sql_disk_size}"
  cloud_sql_disk_type     = "${var.cloud_sql_disk_type}"
  network                 = "${var.network}"
  private_ip_name         = "${var.private_ip_name}"
}

module "dataproc" {
  source = "./dataproc"

  project = "${var.project}"
  region  = "${var.region}"

  bucket_name             = "${var.bucket_name}"
  cloud_sql_instance_name = "${module.cloudsql.sql_db_instance_name_op}"

  dataproc_cluster_name             = "${var.dataproc_cluster_name}"
  dataproc_master_count             = "${var.dataproc_master_count}"
  dataproc_master_machine_type      = "${var.dataproc_master_machine_type}"
  dataproc_master_boot_disk_size_gb = "${var.dataproc_master_boot_disk_size_gb}"
  dataproc_worker_count             = "${var.dataproc_worker_count}"
  dataproc_worker_machine_type      = "${var.dataproc_worker_machine_type}"
  dataproc_worker_boot_disk_size_gb = "${var.dataproc_worker_boot_disk_size_gb}"
}

data "template_file" "presto" {
  template = "${file("${path.module}/presto.sh")}"

  vars {
    DATAPROC_CLUSTER_MASTER_NAME_TERRAFORM = "${module.dataproc.master_name_op}"
  }
}

module "presto_master" {
  source = "./presto_master"

  project = "${var.project}"
  region  = "${var.region}"
  zone    = "${var.zone}"

  network                         = "${var.network}"
  dataproc_ip                     = "${module.dataproc.master_name_op}"
  presto_cluster_name             = "${var.presto_cluster_name}"
  presto_cluster_image            = "${var.presto_cluster_image}"
  presto_master_machine_type      = "${var.presto_master_machine_type}"
  presto_master_boot_disk_size_gb = "${var.presto_master_boot_disk_size_gb}"
  presto_worker_count             = "${var.presto_worker_count}"

  mod_startup_script = "${data.template_file.presto.rendered}"
}

module "presto_worker" {
  source = "./presto_worker"

  project = "${var.project}"
  region  = "${var.region}"
  zone    = "${var.zone}"

  network                         = "${var.network}"
  dataproc_ip                     = "${module.dataproc.master_name_op}"
  presto_worker_count             = "${var.presto_worker_count}"
  presto_cluster_name             = "${var.presto_cluster_name}"
  presto_cluster_image            = "${var.presto_cluster_image}"
  presto_worker_machine_type      = "${var.presto_worker_machine_type}"
  presto_worker_boot_disk_size_gb = "${var.presto_worker_boot_disk_size_gb}"

  mod_startup_script = "${data.template_file.presto.rendered}"
}

resource "google_compute_firewall" "presto-firewall" {
  name    = "allow-presto-service-discovery"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }

  source_tags = ["presto-service-discovery"]
  target_tags = ["presto-service-discovery"]
}
