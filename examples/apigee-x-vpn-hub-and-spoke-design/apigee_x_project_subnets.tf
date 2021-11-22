##########################################################
# Copyright 2021 Google LLC.
# This software is provided as-is, without warranty or
# representation for any use or purpose.
# Your use of it is subject to your agreement with Google.
#
# Sample Terraform script to set up an Apigee X instance 
##########################################################

#######################################################################
### Create 2 subnets, firewall rules and test instances in Apigee X project
#######################################################################
resource "google_compute_subnetwork" "apigee_x_project_subnet1" {
  project                  = google_project.apigee_x_project.project_id
  name                     = "${var.subnet_1}-subnet"
  region                   = "${var.subnet_1}"
  network                  = google_compute_network.apigee_x_vpc.id
  ip_cidr_range            = "10.0.1.0/24"
}

resource "google_compute_subnetwork" "apigee_x_project_subnet2" {
  project                  = google_project.apigee_x_project.project_id
  name                     = "${var.subnet_2}-subnet"
  region                   = "${var.subnet_2}"
  network                  = google_compute_network.apigee_x_vpc.id
  ip_cidr_range            = "10.0.2.0/24"
}

resource "google_compute_firewall" "apigee_x_vpc_allow_ssh" {
  project     = google_project.apigee_x_project.project_id
  name        = "apigee-x-vpc-allow-ssh"
  network     = google_compute_network.apigee_x_vpc.id
  direction   = "INGRESS"
  priority    = 65534
  description = "Creates firewall rile targeting tagged test instances"

  allow {
    protocol = "tcp"
    ports    = ["22"] 
  }
  
  source_ranges = ["0.0.0.0/0"]

  target_tags   = ["apigee-x-vpc-allow-ssh"]
}

resource "google_compute_firewall" "apigee_x_vpc_allow_icmp" {
  project     = google_project.apigee_x_project.project_id
  name        = "apigee-x-vpc-allow-icmp"
  network     = google_compute_network.apigee_x_vpc.id
  direction   = "INGRESS"
  priority    = 65534
  description = "Creates firewall rile targeting tagged test instances"

  allow {
    protocol = "icmp"
  }

  source_ranges = ["0.0.0.0/0"]

  target_tags   = ["apigee-x-vpc-allow-icmp"]
}

resource "google_compute_instance" "instance-01" {
  name         = "instance-01"
  project      = google_project.apigee_x_project.project_id
  machine_type = "n1-standard-1"
  zone         = "${var.subnet_1}-b"

  tags = ["apigee-x-vpc-allow-ssh", "apigee-x-vpc-allow-icmp"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  scratch_disk {
    interface = "SCSI"
  }

  network_interface {
    network    = google_compute_network.apigee_x_vpc.id
    subnetwork = google_compute_subnetwork.apigee_x_project_subnet1.id

    access_config {
      
    }
  }

}

resource "google_compute_instance" "instance-02" {
  name         = "instance-02"
  project      = google_project.apigee_x_project.project_id
  machine_type = "n1-standard-1"
  zone         = "${var.subnet_2}-a"

  tags = ["apigee-x-vpc-allow-ssh", "apigee-x-vpc-allow-icmp"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  scratch_disk {
    interface = "SCSI"
  }

  network_interface {
    network    = google_compute_network.apigee_x_vpc.id
    subnetwork = google_compute_subnetwork.apigee_x_project_subnet1.id

    access_config {

    }
  }

}