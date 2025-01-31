locals {
  subnet_01 = "${var.network_name}-subnet-01"
}

data "google_project" "project" {
  project_id = var.project_id
}

module "vpc" {
  source  = "terraform-google-modules/network/google"
  version = "~> 9.0"

  project_id   = var.project_id
  network_name = var.network_name

  subnets = [
    {
      subnet_name           = local.subnet_01
      subnet_ip             = "10.10.10.0/24"
      subnet_region         = "us-central1"
      subnet_private_access = "true"
    },
  ]

  secondary_ranges = {
    (local.subnet_01) = [
      {
        range_name    = "pods"
        ip_cidr_range = "192.168.64.0/24"
      },
      {
        range_name    = "svcs"
        ip_cidr_range = "192.168.65.0/24"
      },
    ]
  }

  firewall_rules = [
    {
      name      = "allow-iap-ssh-ingress"
      direction = "INGRESS"
      ranges    = ["35.235.240.0/20"]
      allow = [{
        protocol = "tcp"
        ports    = ["22"]
      }]
    },
  ]
}

resource "google_compute_router" "router" {
  project = var.project_id
  name    = "nat-router"
  network = module.vpc.network_name
  region  = "us-central1"
}

module "cloud-nat" {
  source                             = "terraform-google-modules/cloud-nat/google"
  version                            = "~> 5.0"
  project_id                         = var.project_id
  region                             = "us-central1"
  router                             = google_compute_router.router.name
  name                               = "nat-config"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

module "gke" {
  source  = "terraform-google-modules/kubernetes-engine/google//modules/private-cluster"
  version = "~> 33.0"

  project_id              = var.project_id
  name                    = var.cluster_name
  regional                = false
  zones                   = var.zones
  network                 = module.vpc.network_name
  subnetwork              = local.subnet_01
  ip_range_pods           = "pods"
  ip_range_services       = "svcs"
  create_service_account  = true
  enable_private_endpoint = false
  enable_private_nodes    = true
  master_ipv4_cidr_block  = "172.27.0.0/28"
  deletion_protection     = false
  depends_on              = [module.vpc]
}

module "kms" {
  source  = "terraform-google-modules/kms/google"
  version = "~> 3.0"

  project_id = var.project_id
  keyring    = var.keyring
  location   = var.location
  keys       = var.keys
  # keys can be destroyed by Terraform
  prevent_destroy = false
}

module "projects_iam_bindings" {
  source  = "terraform-google-modules/iam/google//modules/projects_iam"
  version = "~> 8.0"

  projects = [var.project_id]

  bindings = {
    "roles/storage.admin" = [
      "principal://iam.googleapis.com/projects/${data.google_project.project.number}/locations/global/workloadIdentityPools/${var.project_id}.svc.id.goog/subject/ns/mitmproxy-demo/sa/gcs-proxy-sa",
    ]

    "roles/cloudkms.cryptoKeyDecrypter" = [
      "principal://iam.googleapis.com/projects/${data.google_project.project.number}/locations/global/workloadIdentityPools/${var.project_id}.svc.id.goog/subject/ns/mitmproxy-demo/sa/gcs-proxy-sa",
    ]

    "roles/cloudkms.cryptoKeyEncrypter" = [
      "principal://iam.googleapis.com/projects/${data.google_project.project.number}/locations/global/workloadIdentityPools/${var.project_id}.svc.id.goog/subject/ns/mitmproxy-demo/sa/gcs-proxy-sa",
    ]
  }
}

resource "google_artifact_registry_repository_iam_member" "gar-iam" {
  project    = var.project_id
  repository = var.gar_repo
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${module.gke.service_account}"
  location   = "us"
}

