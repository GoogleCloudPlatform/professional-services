resource "google_compute_subnetwork" "subnet-01" {
  project                  = "${var.project_id}"
  name                     = "subnet-01"
  region                   = "us-east1"
  network                  = "projects/apigee-x-project-331014/global/networks/apigee-x-vpc" ##google_compute_network.apigee_network.id
  ip_cidr_range            = "10.0.1.0/24"
}

resource "google_compute_subnetwork" "subnet-02" {
  project                  = "${var.project_id}"
  name                     = "subnet-02"
  region                   = "us-west4"
  network                  = "projects/apigee-x-project-331014/global/networks/apigee-x-vpc" ##google_compute_network.apigee_network.id
  ip_cidr_range            = "10.0.2.0/24"
}

resource "google_compute_instance" "instance-01" {
  name         = "instance-01"
  machine_type = "e2-medium"
  zone         = "us-east1-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  scratch_disk {
    interface = "SCSI"
  }

  network_interface {
    network = "apigee-x-vpc"

    access_config {

    }
  }

}

resource "google_compute_instance" "instance-02" {
  name         = "instance-02"
  machine_type = "e2-medium"
  zone         = "us-west4-a"


  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  scratch_disk {
    interface = "SCSI"
  }
  
  network_interface {
    network = "apigee-x-vpc"

    access_config {

    }
  }

}