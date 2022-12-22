/**
 * Copyright 2022 Google LLC
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

locals {
  prefix = (var.prefix == null || var.prefix == "") ? "" : "${var.prefix}-"
  k8s_ns = "apis"
  k8s_sa = "storage-api-sa"
  image = (
    "${var.region}-docker.pkg.dev/${module.project.project_id}/${module.docker_artifact_registry.name}/storage-api"
  )
}

module "project" {
  source = "../../../modules/project"
  billing_account = (var.project_create != null
    ? var.project_create.billing_account_id
    : null
  )
  parent = (var.project_create != null
    ? var.project_create.parent
    : null
  )
  prefix = var.project_create == null ? null : var.prefix
  name   = var.project_id
  services = [
    "artifactregistry.googleapis.com",
    "binaryauthorization.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudkms.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "container.googleapis.com",
    "containeranalysis.googleapis.com",
    "sourcerepo.googleapis.com"
  ]
  iam = {
    "roles/storage.admin" = [module.sa.iam_email]
    "roles/logging.logWriter" = [
      module.image_cb_sa.iam_email,
      module.app_cb_sa.iam_email
    ]
    "roles/container.viewer"                     = [module.app_cb_sa.iam_email]
    "roles/containeranalysis.occurrences.editor" = [module.image_cb_sa.iam_email]
    "roles/containeranalysis.notes.attacher"     = [module.image_cb_sa.iam_email]
  }
}

module "vpc" {
  source     = "../../../modules/net-vpc"
  project_id = module.project.project_id
  name       = "${local.prefix}vpc"
  subnets = [
    {
      ip_cidr_range = var.subnet_cidr_block
      name          = "subnet"
      region        = var.region
      secondary_ip_ranges = {
        pods     = var.pods_cidr_block
        services = var.services_cidr_block
      }
    }
  ]
}

module "nat" {
  source         = "../../../modules/net-cloudnat"
  project_id     = module.project.project_id
  region         = var.region
  name           = "${local.prefix}nat"
  router_network = module.vpc.name
}

module "cluster" {
  source     = "../../../modules/gke-cluster"
  project_id = module.project.project_id
  name       = "${local.prefix}cluster"
  location   = var.zone
  vpc_config = {
    master_ipv4_cidr_block = var.master_cidr_block
    network                = module.vpc.self_link
    subnetwork             = module.vpc.subnet_self_links["${var.region}/subnet"]
  }
  private_cluster_config = {
    enable_private_endpoint = false
    master_global_access    = false
  }
}

module "cluster_nodepool" {
  source       = "../../../modules/gke-nodepool"
  project_id   = module.project.project_id
  cluster_name = module.cluster.name
  location     = var.zone
  name         = "nodepool"
  service_account = {
    create = true
  }
  node_count = { initial = 3 }
}

module "kms" {
  source         = "../../../modules/kms"
  project_id     = module.project.project_id
  keyring        = { location = var.region, name = "test-keyring" }
  keyring_create = true
  keys           = { test-key = null }
  key_purpose = {
    test-key = {
      purpose = "ASYMMETRIC_SIGN"
      version_template = {
        algorithm        = "RSA_SIGN_PKCS1_4096_SHA512"
        protection_level = null
      }
    }
  }
  key_iam = {
    test-key = {
      "roles/cloudkms.publicKeyViewer" = [module.image_cb_sa.iam_email]
      "roles/cloudkms.signer"          = [module.image_cb_sa.iam_email]
    }
  }
}

data "google_kms_crypto_key_version" "version" {
  crypto_key = module.kms.key_ids["test-key"]
}

module "binauthz" {
  source     = "../../../modules/binauthz"
  project_id = module.project.project_id
  default_admission_rule = {
    evaluation_mode  = "ALWAYS_DENY"
    enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"
    attestors        = null
  }
  cluster_admission_rules = {
    "${var.zone}.${module.cluster.name}" = {
      evaluation_mode  = "REQUIRE_ATTESTATION"
      enforcement_mode = "ENFORCED_BLOCK_AND_AUDIT_LOG"
      attestors        = ["test-attestor"]
    }
  }
  attestors_config = {
    "test-attestor" : {
      note_reference  = null
      pgp_public_keys = null
      pkix_public_keys = [{
        id                  = data.google_kms_crypto_key_version.version.id
        public_key_pem      = data.google_kms_crypto_key_version.version.public_key[0].pem
        signature_algorithm = data.google_kms_crypto_key_version.version.public_key[0].algorithm
      }]
      iam = {
        "roles/binaryauthorization.attestorsViewer" = [module.image_cb_sa.iam_email]
      }
    }
  }
}

module "docker_artifact_registry" {
  source     = "../../../modules/artifact-registry"
  project_id = module.project.project_id
  location   = var.region
  format     = "DOCKER"
  id         = "${local.prefix}registry"
  iam = {
    "roles/artifactregistry.writer" = [module.image_cb_sa.iam_email]
    "roles/artifactregistry.reader" = [module.cluster_nodepool.service_account_iam_email]
  }
}

module "image_cb_sa" {
  source     = "../../../modules/iam-service-account"
  project_id = module.project.project_id
  name       = "sa-cb-image"
}

module "image_repo" {
  source     = "../../../modules/source-repository"
  project_id = module.project.project_id
  name       = "${local.prefix}image"
  triggers = {
    image-trigger = {
      filename        = "cloudbuild.yaml"
      included_files  = null
      service_account = module.image_cb_sa.id
      template = {
        branch_name = "main"
        project_id  = module.project.project_id
        tag_name    = null
      }
      substitutions = {
        _IMAGE       = local.image
        _ATTESTOR    = module.binauthz.attestors["test-attestor"].id
        _KEY_VERSION = data.google_kms_crypto_key_version.version.name
      }
    }
  }
  iam = {
    "roles/source.reader" = [module.image_cb_sa.iam_email]
  }
}

module "app_cb_sa" {
  source     = "../../../modules/iam-service-account"
  project_id = module.project.project_id
  name       = "sa-cb-app"
}

module "app_repo" {
  source     = "../../../modules/source-repository"
  project_id = module.project.project_id
  name       = "${local.prefix}app"
  triggers = {
    app-trigger = {
      filename        = "cloudbuild.yaml"
      included_files  = null
      service_account = module.app_cb_sa.id
      template = {
        branch_name = "main"
        project_id  = module.project.project_id
        tag_name    = null
      }
      substitutions = {
        _ZONE    = var.zone
        _CLUSTER = module.cluster.name
      }
    }
  }
  iam = {
    "roles/source.reader" = [module.app_cb_sa.iam_email]
  }
}

module "sa" {
  source     = "../../../modules/iam-service-account"
  project_id = module.project.project_id
  name       = "sa-storage-api"
  iam = {
    "roles/iam.workloadIdentityUser" : ["serviceAccount:${module.cluster.cluster.project}.svc.id.goog[${local.k8s_ns}/${local.k8s_sa}]"]
  }
}

resource "local_file" "app_file" {
  content = templatefile("${path.module}/templates/app.yaml.tpl", {
    k8s_ns    = local.k8s_ns
    k8s_sa    = local.k8s_sa
    google_sa = module.sa.email
    image     = local.image
  })
  filename        = "${path.module}/app/app.yaml"
  file_permission = "0666"
}

resource "local_file" "rbac_file" {
  content = templatefile("${path.module}/templates/tenant-setup.yaml.tpl", {
    k8s_ns    = local.k8s_ns
    google_sa = module.app_cb_sa.email
  })
  filename        = "${path.module}/tenant-setup.yaml"
  file_permission = "0666"
}
