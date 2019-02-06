resource "google_storage_bucket" "hive-warehouse-dir" {
  name          = "${var.bucket_name}"
  location      = "${var.region}"
  project       = "${var.project}"
  force_destroy = true
}

resource "google_compute_global_address" "private_ip_alloc" {
  provider      = "google-beta"
  name          = "${var.private_ip_name}"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 20
  network       = "projects/${var.project}/global/networks/${var.network}"
}

resource "google_service_networking_connection" "googleservice" {
  provider                = "google-beta"
  network                 = "projects/${var.project}/global/networks/${var.network}"
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = ["${google_compute_global_address.private_ip_alloc.name}"]
}

resource "google_sql_database_instance" "hive-metastore-instance" {
  name             = "${var.cloud_sql_instance_name}"
  database_version = "MYSQL_5_7"
  region           = "${var.region}"
  project          = "${var.project}"

  settings {
    tier              = "${var.tier}"
    activation_policy = "${var.activation_policy}"
    disk_size         = "${var.cloud_sql_disk_size}"
    disk_type         = "${var.cloud_sql_disk_type}"

    ip_configuration {
      ipv4_enabled    = "false"
      private_network = "projects/${var.project}/global/networks/${var.network}"
    }
  }

  depends_on = ["google_compute_global_address.private_ip_alloc", "google_service_networking_connection.googleservice"]
}

resource "google_sql_user" "root-user" {
  name     = "root"
  instance = "${google_sql_database_instance.hive-metastore-instance.name}"
  project  = "${var.project}"
  host     = "%"
  password = ""
}

resource "null_resource" "patch_sql" {
  provisioner "local-exec" {
    on_failure = "continue"

    command = <<EOF
flag=1 \
&& while [ $flag -ne 0 ]; do
gcloud beta sql instances patch  ${google_sql_database_instance.hive-metastore-instance.name} --no-assign-ip \
&& flag=$?;
if [ $flag -ne 0 ]; then
sleep 90s;fi
done
EOF
  }

  depends_on = ["google_sql_database_instance.hive-metastore-instance", "google_sql_user.root-user", "google_compute_global_address.private_ip_alloc", "google_service_networking_connection.googleservice"]
}
