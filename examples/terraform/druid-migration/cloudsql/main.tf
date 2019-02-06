resource "google_storage_bucket" "staging-bucket" {
  name          = "${var.bucket_name}"
  location      = "${var.region}"
  project       = "${var.project}"
  force_destroy = true
}

data "template_file" "dataproc-init" {
  template = "${file("${path.module}/dataproc_init.sh")}"

  vars {
    bucket = "${var.bucket_name}"
  }
}

resource "google_storage_bucket_object" "init-script" {
  name    = "dataproc_init.sh"
  content = "${data.template_file.dataproc-init.rendered}"
  bucket  = "${google_storage_bucket.staging-bucket.name}"
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

resource "google_sql_database_instance" "cloudsql" {
  name             = "${var.cloud_sql_instance_name}"
  region           = "${var.region}"
  project          = "${var.project}"
  database_version = "${var.database_version}"

  settings {
    tier              = "${var.tier}"
    activation_policy = "${var.activation_policy}"
    disk_size         = "${var.disk_size}"
    disk_type         = "${var.disk_type}"

    ip_configuration {
      ipv4_enabled    = "false"
      private_network = "projects/${var.project}/global/networks/${var.network}"
    }
  }

  depends_on = ["google_compute_global_address.private_ip_alloc", "google_service_networking_connection.googleservice"]
}

resource "google_sql_database" "database" {
  name     = "${var.db_name}"
  project  = "${var.project}"
  instance = "${google_sql_database_instance.cloudsql.name}"
}

resource "random_string" "password" {
  length  = 16
  special = false
}

resource "google_sql_user" "default" {
  name     = "${var.user_name}"
  instance = "${google_sql_database_instance.cloudsql.name}"
  host     = "${var.user_host}"
  password = "${random_string.password.result}"
}

resource "null_resource" "patch_sql" {
  provisioner "local-exec" {
    on_failure = "continue"

    command = <<EOF
flag=1 \
&& while [ $flag -ne 0 ]; do
gcloud beta sql instances patch  ${google_sql_database_instance.cloudsql.name} --no-assign-ip \
&& flag=$?;
if [ $flag -ne 0 ]; then
sleep 90s;fi
done
EOF
  }

  depends_on = ["google_sql_database_instance.cloudsql", "google_sql_database.database", "google_sql_user.default", "google_compute_global_address.private_ip_alloc", "google_service_networking_connection.googleservice"]
}
