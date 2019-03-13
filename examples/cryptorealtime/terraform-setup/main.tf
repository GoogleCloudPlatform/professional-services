# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


provider "google" {
  region = "${var.region}"
  credentials = "${file("${var.credsfile}")}"
  project = "${var.project_id}"
}


resource "google_bigtable_instance" "instance" {
  project = "${var.project_id}"
  name = "${var.bigtable_instance_name}"
  instance_type = "DEVELOPMENT"
  cluster {
    cluster_id = "${var.bigtable_instance_name}-cluster"
    zone = "${var.zone}"
    storage_type = "HDD"
  }
}


resource "google_compute_instance" "default" {
  project = "${var.project_id}"
  zone = "${var.zone}"
  name = "tf-compute-1"
  machine_type = "n1-standard-1"
  boot_disk {
    initialize_params {
      image = "debian-9-stretch-v20181210"
      size = "20"
    }
  }

  metadata_startup_script = "${data.template_cloudinit_config.config.rendered}"

  network_interface {
    network = "default"
    access_config {
    }
  }

  service_account {
    scopes = [
      "cloud-platform"]
    email = "${google_service_account.vmaccess.email}"
  }

  // Apply the firewall rule to allow external IPs to access this instance
  tags = [
    "http-server"]


}


resource "google_compute_firewall" "http-server" {
  project = "${var.project_id}"
  name = "webserver5000rule"
  network = "default"

  allow {
    protocol = "tcp"
    ports = [
      "80",
      "5000"]
  }

  // Allow traffic from everywhere to instances with an http-server tag
  source_ranges = [
    "0.0.0.0/0"]
  target_tags = [
    "http-server"]
}

output "ip" {
  value = "${google_compute_instance.default.network_interface.0.access_config.0.nat_ip}"
}


resource "google_storage_bucket" "cryptorealtime-demo-staging" {
  name = "${var.bucket_name}"
  location = "US"
  force_destroy = true
}

data "template_file" "init" {
  template = "${file("${path.module}/startup.tpl")}"
  vars = {
    project_id = "${var.project_id}"
    region = "${var.region}"
    zone = "${var.zone}"
    bucket_name = "${var.bucket_name}",
    bucket_folder = "${var.bucket_folder}",
    bigtable_instance_name = "${var.bigtable_instance_name}",
    bigtable_table_name = "${var.bigtable_table_name}",
    bigtable_family_name = "${var.bigtable_family_name}"
  }
}


# Render a multi-part cloud-init config making use of the part
# above, and other source files
data "template_cloudinit_config" "config" {
  gzip = false
  base64_encode = false

  part {
    filename = "script-rendered.sh"
    content_type = "text/x-shellscript"
    content = "${data.template_file.init.rendered}"
  }

}