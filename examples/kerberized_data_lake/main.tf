# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
#
# This software is provided as-is,
# without warranty or representation for any use or purpose.
# Your use of it is subject to your agreement with Google.

locals {
  host_domain = "${var.zone}.c.${var.project}.internal"
}


# Create a SA for each dataproc cluster.
module "service_accounts" {
  source     = "terraform-google-modules/service-accounts/google"
  version    = "~> 2.0"
  project_id = var.project
  prefix     = "dataproc"
  names = [
    "${var.kdc_cluster}-sa",
    "${var.analytics_cluster}-sa",
    "${var.metastore_cluster}-sa",
  ]
  project_roles = [
    "${var.project}=>roles/dataproc.worker",
    # Production TODO: we should ideally assign unifrom bucket-level IAM access.
    # https://cloud.google.com/storage/docs/uniform-bucket-level-access
    # If there are large buckets that are divided by prefix we could leverage
    # IAM conditions on GCS prefix https://cloud.google.com/iam/docs/conditions-overview
    "${var.project}=>roles/storage.objectViewer",
  ]
}

module "data_lake_buckets" {
  source     = "terraform-google-modules/cloud-storage/google"
  version    = "~> 1.6"
  project_id = var.project
  location   = var.bucket_location_map[split("-", var.region)[0]]

  names = [
    "dataproc-scripts", # This will house init actions and shutdown scripts
    "dataproc-secrets", # This will house encrypted kerberos principal passwords
    "dataproc-staging", # https://cloud.google.com/dataproc/docs/concepts/configuring-clusters/staging-bucket
    "data-lake",        # this  will house test data files
  ]

  prefix          = var.project
  set_admin_roles = true

  admins = [
    "user:${var.data_lake_super_admin}"
  ]

  creators = [
    module.service_accounts.iam_emails["${var.analytics_cluster}-sa"],
  ]

  viewers = module.service_accounts.iam_emails_list
}

locals {
  secrets_to_generate = [
    "${var.kdc_cluster}_principal",
    "${var.metastore_cluster}_principal",
    "${var.analytics_cluster}_principal",
    "trust_${var.analytics_cluster}_${var.kdc_cluster}_principal",
    "trust_${var.metastore_cluster}_${var.kdc_cluster}_principal",
    "trust_${var.metastore_cluster}_${var.analytics_cluster}_principal",
  ]
}

# This is a script to stage mock encrypted principals on GCS.
resource "null_resource" "encrypted_principals" {
  depends_on = [
    module.kms.keyring_resource,
  ]

  provisioner "local-exec" {
    command = "${path.module}/scripts/stage-generated-secrets.sh ${join(" ", local.secrets_to_generate)}"
    environment = {
      KMS_KEY_URI    = module.kms.keys[var.dataproc_kms_key]
      SECRETS_BUCKET = module.data_lake_buckets.names["dataproc-secrets"]
    }
  }
}

module "setup_kerberos_config" {
  source    = "./modules/template_bash_script"
  tmpl_file = "${path.module}/scripts/init-actions/setup-kerberos-config.sh.tmpl"
  subs = {
    CLIENT_CLUST_REALM  = var.analytics_realm
    CLIENT_CLUST_MASTER = "${var.analytics_cluster}-m"
    HOST_DOMAIN         = local.host_domain
    KEY_CLUST_NAME      = var.kdc_cluster
    CLUST_KMS_KEY_URI   = module.kms.keys[var.dataproc_kms_key]

    # FOO KDC REALM
    KEY_KRB_CLUSTER_CORP_KDC_REALM = var.corp_kdc_realm
    KEY_KRB5_FOO_MASTER            = "${var.kdc_cluster}-m"

    # HIVE METASTORE REALM
    KEY_KRB_CLUSTER_HMS_REALM = var.metastore_realm
    KEY_KRB5_HIVE_MASTER      = "${var.metastore_cluster}-m"
  }
}

module "setup_kerberos_trust" {
  source    = "./modules/template_bash_script"
  tmpl_file = "${path.module}/scripts/init-actions/setup-kerberos-trust.sh.tmpl"
  subs = {
    CLIENT_REALM           = var.analytics_realm
    KEY_CLIENT_CLUST       = var.analytics_cluster
    KEY_HMS_CLUST          = var.metastore_cluster
    KEY_CLUST_REALM        = var.corp_kdc_realm
    KEY_KRB_CLUSTER_CLIENT = var.analytics_cluster
    HOST_DOMAIN            = local.host_domain
    CLUST_KMS_KEY_URI      = module.kms.keys[var.dataproc_kms_key]
    SECRETS_BUCKET         = module.data_lake_buckets.names["dataproc-secrets"]

    # Hive Metastore Realm
    KEY_KRB_CLUSTER_HMS       = var.metastore_cluster
    KEY_KRB_CLUSTER_HMS_REALM = var.metastore_realm
    KEY_KRB5_HIVE_MASTER      = "${var.metastore_cluster}-m"
    KEY_KRB5_HIVE_SECRET      = "gs://${module.data_lake_buckets.names["dataproc-secrets"]}/${var.metastore_cluster}_principal.encrypted"
    HMS_URIS                  = "thrift://${var.metastore_cluster}-m:9083"

    # FOO REALM
    KEY_KRB_CLUSTER_CORP_KDC       = var.kdc_cluster
    KEY_KRB_CLUSTER_CORP_KDC_REALM = var.corp_kdc_realm
    KEY_KRB5_FOO_MASTER            = "${var.kdc_cluster}-m"
    KEY_KRB5_FOO_SECRET            = "gs://${module.data_lake_buckets.names["dataproc-secrets"]}/${var.kdc_cluster}_principal.encrypted"
    BASE_GCS_PATH                  = module.data_lake_buckets.names["dataproc-secrets"]
    KRB_CLUSTER_CORP_KDC           = var.kdc_cluster
  }
}

module "setup_users_config" {
  source    = "./modules/template_bash_script"
  tmpl_file = "${path.module}/scripts/init-actions/setup-users-config.sh.tmpl"
  subs = {
    KEY_CLUST_NAME  = var.kdc_cluster
    KEY_CLUST_REALM = var.corp_kdc_realm
    CLIENT_REALM    = var.analytics_realm
    HMS_REALM       = var.metastore_realm
    CLIENT_CLUST    = var.analytics_cluster
    HMS_CLUST       = var.metastore_cluster

    HOST_DOMAIN       = local.host_domain
    CLUST_KMS_KEY_URI = module.kms.keys[var.dataproc_kms_key]

    CLIENT_BASE_GCS_PATH = "${module.data_lake_buckets.names["dataproc-secrets"]}/keytabs"
  }
}

module "create_users" {
  source    = "./modules/template_bash_script"
  tmpl_file = "${path.module}/scripts/init-actions/create-users.sh.tmpl"
  subs = {
    KEY_CLUST_NAME    = var.kdc_cluster
    KEY_CLUST_REALM   = var.corp_kdc_realm
    HOST_DOMAIN       = local.host_domain
    CLUST_KMS_KEY_URI = module.kms.keys[var.dataproc_kms_key]

    CLIENT_BASE_GCS_PATH = "${module.data_lake_buckets.names["dataproc-secrets"]}/keytabs"
  }
}

locals {
  static_init_actions = {
    "disable-history-server" = "${path.module}/scripts/init-actions/disable-history-server.sh"
    "export-hadoop-configs"  = "${path.module}/scripts/init-actions/export-hadoop-configs.sh"
  }
  templated_init_actions = {
    "setup-kerberos-config" = module.setup_kerberos_config.rendered
    "setup-kerberos-trust"  = module.setup_kerberos_trust.rendered
    "setup-users-config"    = module.setup_users_config.rendered
    "create-users"          = module.create_users.rendered
  }
  shutdown_scripts = {
    "shutdown-cleanup-trust" = "${path.module}/scripts/shutdown-scripts/shutdown-cleanup-trust.sh.tmpl"
  }
}

resource "google_storage_bucket_object" "static_init_actions" {
  for_each = local.static_init_actions

  name = "init-actions/${each.key}.sh"
  # https://www.terraform.io/docs/configuration/functions/templatefile.html
  source = each.value
  bucket = module.data_lake_buckets.names["dataproc-scripts"]
}

resource "google_storage_bucket_object" "rendered_init_actions" {
  for_each = local.templated_init_actions

  name = "init-actions/${each.key}.sh"
  # https://www.terraform.io/docs/configuration/functions/templatefile.html
  content = each.value
  bucket  = module.data_lake_buckets.names["dataproc-scripts"]
}

resource "google_storage_bucket_object" "shutdown_scripts" {
  for_each = local.shutdown_scripts

  name   = "shutdown-scripts/${each.value}"
  source = each.value
  bucket = module.data_lake_buckets.names["dataproc-scripts"]
}



module "kms" {
  source  = "terraform-google-modules/kms/google"
  version = "~> 1.2"

  project_id = var.project
  location   = split("-", var.region)[0]
  keyring    = var.kms_key_ring
  # For simplicity of example all secrets are encrypted with the same key and
  # All dataproc service accounts have permissions to decrypt using this key.
  # In a production kerberized data lake solution you would provsion more
  # granular keys and assign permissions accordingly.
  keys               = [var.dataproc_kms_key]
  set_owners_for     = [var.dataproc_kms_key]
  set_encrypters_for = [var.dataproc_kms_key]
  set_decrypters_for = [var.dataproc_kms_key]
  owners             = ["user:${var.data_lake_super_admin}"]
  encrypters = [
    # In this example KDC cluster's create-users init action uses key
    # to encrypt keytabs that are uploaded to GCS for each user.
    module.service_accounts.iam_emails["${var.kdc_cluster}-sa"]
  ]
  # Production TODO: Each secret should be encrypted with it's own key
  # and decrypter permissions assigned accordingly e.g. so that analytics
  # cluster sa cannot decrypt the HMS principal secret but can decrypt it's own
  # principal secret and the trust secret.
  decrypters = [
    join(",", [
      module.service_accounts.iam_emails["${var.kdc_cluster}-sa"],
      module.service_accounts.iam_emails["${var.metastore_cluster}-sa"],
      module.service_accounts.iam_emails["${var.analytics_cluster}-sa"],
    ])
  ]
  prevent_destroy = "false"
}


locals {
  tenants = [for t in var.tenants : "${t}-svc"]
}

resource "google_dataproc_cluster" "kdc_cluster" {
  provider = google-beta
  depends_on = [
    null_resource.encrypted_principals,
    google_storage_bucket_object.rendered_init_actions["create-users"],
    google_storage_bucket_object.static_init_actions["export-hadoop-configs"],
  ]

  project = var.project
  name    = var.kdc_cluster
  region  = var.region

  cluster_config {
    staging_bucket = module.data_lake_buckets.names["dataproc-staging"]

    gce_cluster_config {
      zone             = var.zone
      service_account  = module.service_accounts.emails["${var.kdc_cluster}-sa"]
      subnetwork       = var.dataproc_subnet
      internal_ip_only = true

      metadata = {
        "enable-oslogin"  = "false"
        "purpose"         = "KDC"
        "user-setup-list" = join(",", setunion(var.users, local.tenants))
        "VmDnsSetting"    = "ZonalOnly"
      }
      tags = ["ssh"]
    }

    master_config {
      num_instances = 1
      machine_type  = "n1-standard-4"

      disk_config {
        boot_disk_type    = "pd-standard"
        boot_disk_size_gb = 50
      }
    }

    security_config {
      kerberos_config {
        enable_kerberos             = "true"
        realm                       = var.corp_kdc_realm
        kms_key_uri                 = module.kms.keys[var.dataproc_kms_key]
        root_principal_password_uri = "gs://${module.data_lake_buckets.names["dataproc-secrets"]}/${var.kdc_cluster}_principal.encrypted"
      }

    }

    software_config {
      image_version = "1.4-debian10"

      override_properties = {
        "dataproc:yarn.log-aggregation.enabled" = "true"
        "dataproc:dataproc.allow.zero.workers"  = "true"
      }

    }

    endpoint_config {
      enable_http_port_access = "true"
    }

    initialization_action {
      script = "gs://${module.data_lake_buckets.names["dataproc-scripts"]}/${google_storage_bucket_object.rendered_init_actions["create-users"].name}"
    }

    initialization_action {
      script = "gs://${module.data_lake_buckets.names["dataproc-scripts"]}/${google_storage_bucket_object.static_init_actions["export-hadoop-configs"].name}"
    }
  }
}

# Production TODO: move HMS database into Cloud SQL (old way) or DPMS (alpha)
# https://cloud.google.com/solutions/using-apache-hive-on-cloud-dataproc
# https://cloud.google.com/blog/products/data-analytics/cloud-hive-metastore-now-available
resource "google_dataproc_cluster" "metastore_cluster" {
  provider = google-beta
  depends_on = [
    google_dataproc_cluster.kdc_cluster,
    null_resource.encrypted_principals,
    google_storage_bucket_object.rendered_init_actions["setup-users-config"],
    google_storage_bucket_object.rendered_init_actions["setup-kerberos-trust"],
    google_storage_bucket_object.rendered_init_actions["disable-history-server"],
    google_storage_bucket_object.shutdown_scripts["shutdown-cleanup-trust"],
    google_storage_bucket_object.static_init_actions["export-hadoop-configs"],
  ]

  project = var.project
  name    = var.metastore_cluster
  region  = var.region

  cluster_config {
    staging_bucket = module.data_lake_buckets.names["dataproc-staging"]

    gce_cluster_config {
      zone             = var.zone
      service_account  = module.service_accounts.emails["${var.metastore_cluster}-sa"]
      subnetwork       = var.dataproc_subnet
      internal_ip_only = true

      metadata = {
        "enable-oslogin"      = "false"
        "shutdown-script-url" = "gs://${module.data_lake_buckets.names["dataproc-scripts"]}/${google_storage_bucket_object.shutdown_scripts["shutdown-cleanup-trust"].name}"
        "purpose"             = "METASTORE"
        "user-setup-list"     = join(",", setunion(var.users, local.tenants))
        "VmDnsSetting"        = "ZonalOnly"
      }
      tags = ["ssh"]
    }

    master_config {
      num_instances = 1
      machine_type  = "n1-standard-4"

      disk_config {
        boot_disk_type    = "pd-standard"
        boot_disk_size_gb = 50
      }
    }

    security_config {
      kerberos_config {
        enable_kerberos                       = "true"
        kms_key_uri                           = module.kms.keys[var.dataproc_kms_key]
        realm                                 = var.metastore_realm
        root_principal_password_uri           = "gs://${module.data_lake_buckets.names["dataproc-secrets"]}/${var.metastore_cluster}_principal.encrypted"
        cross_realm_trust_realm               = var.corp_kdc_realm
        cross_realm_trust_kdc                 = "${var.kdc_cluster}-m"
        cross_realm_trust_admin_server        = "${var.kdc_cluster}-m"
        cross_realm_trust_shared_password_uri = "gs://${module.data_lake_buckets.names["dataproc-secrets"]}/trust_${var.metastore_cluster}_${var.kdc_cluster}_principal.encrypted"
      }
    }

    software_config {
      image_version = "1.4-debian10"

      override_properties = {
        "dataproc:yarn.log-aggregation.enabled" = "true"
        "dataproc:dataproc.allow.zero.workers"  = "true"
      }
    }

    endpoint_config {
      enable_http_port_access = "true"
    }

    initialization_action {
      script = "gs://${module.data_lake_buckets.names["dataproc-scripts"]}/${google_storage_bucket_object.rendered_init_actions["setup-kerberos-trust"].name}"
    }

    initialization_action {
      script = "gs://${module.data_lake_buckets.names["dataproc-scripts"]}/${google_storage_bucket_object.static_init_actions["disable-history-server"].name}"
    }

    initialization_action {
      script = "gs://${module.data_lake_buckets.names["dataproc-scripts"]}/${google_storage_bucket_object.rendered_init_actions["setup-users-config"].name}"
    }

    initialization_action {
      script = "gs://${module.data_lake_buckets.names["dataproc-scripts"]}/${google_storage_bucket_object.static_init_actions["export-hadoop-configs"].name}"
    }

  }
}


resource "google_dataproc_cluster" "analytics_cluster" {
  provider = google-beta
  depends_on = [
    google_dataproc_cluster.kdc_cluster,
    google_dataproc_cluster.metastore_cluster,
    null_resource.encrypted_principals,
    google_storage_bucket_object.rendered_init_actions["setup-users-config"],
    google_storage_bucket_object.rendered_init_actions["setup-kerberos-trust"],
    google_storage_bucket_object.rendered_init_actions["disable-history-server"],
    google_storage_bucket_object.shutdown_scripts["shutdown-cleanup-trust"],
    google_storage_bucket_object.rendered_init_actions["setup-users-config"],
    google_storage_bucket_object.static_init_actions["export-hadoop-configs"],
  ]

  project = var.project
  name    = var.analytics_cluster
  region  = var.region

  cluster_config {
    staging_bucket = module.data_lake_buckets.names["dataproc-staging"]

    gce_cluster_config {
      zone             = var.zone
      service_account  = module.service_accounts.emails["${var.analytics_cluster}-sa"]
      subnetwork       = var.dataproc_subnet
      internal_ip_only = true

      metadata = {
        "enable-oslogin"      = "false"
        "shutdown-script-url" = "gs://${module.data_lake_buckets.names["dataproc-scripts"]}/${google_storage_bucket_object.shutdown_scripts["shutdown-cleanup-trust"].name}"
        "purpose"             = "ANALYTICS"
        "user-setup-list"     = join(",", setunion(var.users, local.tenants))
        "VmDnsSetting"        = "ZonalOnly"
      }
      tags = ["ssh"]
    }

    master_config {
      num_instances = 1
      machine_type  = "n1-standard-4"

      disk_config {
        boot_disk_type    = "pd-standard"
        boot_disk_size_gb = 500
      }
    }

    worker_config {
      num_instances = 2
      machine_type  = "n1-standard-2"

      disk_config {
        boot_disk_type    = "pd-standard"
        boot_disk_size_gb = 500
      }
    }

    security_config {
      kerberos_config {
        enable_kerberos                       = "true"
        kms_key_uri                           = module.kms.keys[var.dataproc_kms_key]
        realm                                 = var.analytics_realm
        root_principal_password_uri           = "gs://${module.data_lake_buckets.names["dataproc-secrets"]}/${var.analytics_cluster}_principal.encrypted"
        cross_realm_trust_realm               = var.corp_kdc_realm
        cross_realm_trust_kdc                 = "${var.kdc_cluster}-m"
        cross_realm_trust_admin_server        = "${var.kdc_cluster}-m"
        cross_realm_trust_shared_password_uri = "gs://${module.data_lake_buckets.names["dataproc-secrets"]}/trust_${var.analytics_cluster}_${var.kdc_cluster}_principal.encrypted"
      }
    }

    software_config {
      image_version = "1.4-debian10"

      override_properties = {
        "dataproc:yarn.log-aggregation.enabled" = "true"
        // yarn timeline service not compatible with spark client
        // https://issues.apache.org/jira/browse/SPARK-15343
        "yarn:yarn.timeline-service.enabled" = "false"
      }
      optional_components = ["PRESTO"]
    }

    endpoint_config {
      enable_http_port_access = "true"
    }

    initialization_action {
      script = "gs://${module.data_lake_buckets.names["dataproc-scripts"]}/${google_storage_bucket_object.rendered_init_actions["setup-kerberos-config"].name}"
    }

    initialization_action {
      script = "gs://${module.data_lake_buckets.names["dataproc-scripts"]}/${google_storage_bucket_object.rendered_init_actions["setup-kerberos-trust"].name}"
    }


    initialization_action {
      script = "gs://${module.data_lake_buckets.names["dataproc-scripts"]}/${google_storage_bucket_object.rendered_init_actions["setup-users-config"].name}"
    }

    initialization_action {
      script = "gs://${module.data_lake_buckets.names["dataproc-scripts"]}/${google_storage_bucket_object.static_init_actions["export-hadoop-configs"].name}"
    }

  }
}
