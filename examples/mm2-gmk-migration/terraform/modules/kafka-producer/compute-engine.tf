# ------------------------------------------------------------------------------
# Create a Google Compute Engine and Bootstrap the same
# ------------------------------------------------------------------------------

# resource "google_service_account" "default" {
#   account_id   = "my-custom-sa"
#   display_name = "Custom SA for VM Instance"
# }

resource "google_compute_instance" "kafka-producer" {
  project      = var.project_id
  name         = var.name
  machine_type = var.machine_type
  zone         = var.zone

  tags = ["gce", "kafka-producer"]

  boot_disk {
    initialize_params {
      image = var.image
      labels = {
        gce = "kafka-producer"
      }
    }
  }

  // Local SSD disk
  scratch_disk {
    interface = "NVME"
  }

  network_interface {
    network = "default"

    access_config {
      // Ephemeral public IP
    }
  }

  metadata = {
    kafka-client = "kafka-producer"
  }

  metadata_startup_script = <<SCRIPT
    #! /bin/bash

    # Install pip, a Python package manager and the virtual environment manager
    sudo apt install python3-pip -y
    sudo apt install python3-venv -y

    # Instance wide Install
    pip install confluent-kafka google-auth urllib3 packaging
    pip3 install confluent-kafka google-auth urllib3 packaging

    # Activate Python Env
    python3 -m venv kafka
    source kafka/bin/activate

    # Install kafka client binaries
    pip install confluent-kafka google-auth urllib3 packaging
    SCRIPT

  # service_account {
  #   # Google recommends custom service accounts that have cloud-platform scope and permissions granted via IAM Roles.
  #   email  = google_service_account.default.email
  #   scopes = ["cloud-platform"]
  # }
}