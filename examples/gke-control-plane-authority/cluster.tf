/**
 * Copyright 2025 Google LLC
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

resource "google_container_cluster" "cpa-cluster" {
  provider       = google-beta
  depends_on     = [time_sleep.wait]
  name           = local.cluster_name
  node_locations = var.zones
  location       = var.region


  remove_default_node_pool = true
  initial_node_count       = 1

  deletion_protection   = false
  enable_shielded_nodes = true

  release_channel {
    channel = var.release_channel
  }

  datapath_provider = "ADVANCED_DATAPATH"
  network           = "projects/${var.network_project_id}/global/networks/${var.network}"
  subnetwork        = "projects/${var.network_project_id}/regions/${var.region}/subnetworks/${var.subnetwork}"

  node_config {
    preemptible  = false
    machine_type = var.machine_type
    disk_type    = var.disk_type
    disk_size_gb = var.disk_size

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    service_account = var.worker_service_account
    oauth_scopes    = var.oauth_scopes

    tags = var.tags
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = var.ip_range_pods
    services_secondary_range_name = var.ip_range_services
  }

  private_cluster_config {
    enable_private_nodes = true
  }

  monitoring_config {
    advanced_datapath_observability_config {
      enable_metrics = true
      enable_relay   = true
    }
    enable_components = [
      "SYSTEM_COMPONENTS",
      "DAEMONSET",
      "DEPLOYMENT",
      "STATEFULSET",
      "STORAGE",
      "HPA",
      "POD",
      "CADVISOR",
      "KUBELET"
    ]
  }

  logging_config {
    enable_components = [
      "KCP_SSHD",
      "KCP_CONNECTION",
      "APISERVER",
      "SCHEDULER",
      "CONTROLLER_MANAGER",
      "SYSTEM_COMPONENTS",
      "WORKLOADS"
    ]
  }
  user_managed_keys_config {
    cluster_ca     = google_privateca_ca_pool.ca-pools["cluster-ca-${local.suffix}"].id
    etcd_api_ca    = google_privateca_ca_pool.ca-pools["etcd-api-ca-${local.suffix}"].id
    etcd_peer_ca   = google_privateca_ca_pool.ca-pools["etcd-api-ca-${local.suffix}"].id
    aggregation_ca = google_privateca_ca_pool.ca-pools["aggregation-ca-${local.suffix}"].id

    service_account_signing_keys = [
      data.google_kms_crypto_key_latest_version.sa-signing-keys-version["sa-signing-${local.suffix}"].name
    ]
    service_account_verification_keys = [
      data.google_kms_crypto_key_latest_version.sa-signing-keys-version["sa-signing-${local.suffix}"].name
    ]
  }

  resource_labels = local.labels
}

resource "google_container_node_pool" "gke-nodepool" {
  provider   = google-beta
  depends_on = [google_container_cluster.cpa-cluster]
  name       = "${var.cluster_name}-${local.suffix}-01"
  cluster    = google_container_cluster.cpa-cluster.id

  initial_node_count = var.min_node_count

  autoscaling {
    min_node_count = var.min_node_count
    max_node_count = var.max_node_count
  }

  node_config {
    preemptible  = false
    machine_type = var.machine_type
    disk_type    = var.disk_type
    disk_size_gb = var.disk_size

    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    service_account = var.worker_service_account
    oauth_scopes    = var.oauth_scopes

    tags   = var.tags
    labels = local.labels
  }
}
