# GKE hub module

This module allows simplified creation and management of a GKE Hub object and its features for a given set of clusters. The given list of clusters will be registered inside the Hub and all the configured features will be activated.

To use this module you must ensure the following APIs are enabled in the target project:

- `gkehub.googleapis.com`
- `gkeconnect.googleapis.com`
- `anthosconfigmanagement.googleapis.com`
- `multiclusteringress.googleapis.com`
- `multiclusterservicediscovery.googleapis.com`
- `mesh.googleapis.com`

## Full GKE Hub example

```hcl
module "project" {
  source          = "./fabric/modules/project"
  billing_account = var.billing_account_id
  name            = "gkehub-test"
  parent          = "folders/12345"
  services = [
    "anthosconfigmanagement.googleapis.com",
    "container.googleapis.com",
    "gkeconnect.googleapis.com",
    "gkehub.googleapis.com",
    "multiclusteringress.googleapis.com",
    "multiclusterservicediscovery.googleapis.com",
    "mesh.googleapis.com"
  ]
}

module "vpc" {
  source     = "./fabric/modules/net-vpc"
  project_id = module.project.project_id
  name       = "network"
  subnets = [{
    ip_cidr_range = "10.0.0.0/24"
    name          = "cluster-1"
    region        = "europe-west1"
    secondary_ip_range = {
      pods     = "10.1.0.0/16"
      services = "10.2.0.0/24"
    }
  }]
}

module "cluster_1" {
  source     = "./fabric/modules/gke-cluster"
  project_id = module.project.project_id
  name       = "cluster-1"
  location   = "europe-west1"
  vpc_config = {
    network    = module.vpc.self_link
    subnetwork = module.vpc.subnet_self_links["europe-west1/cluster-1"]
    master_authorized_ranges = {
      fc1918_10_8 = "10.0.0.0/8"
    }
    master_ipv4_cidr_block  = "192.168.0.0/28"
  }
  enable_features = {
    dataplane_v2      = true
    workload_identity = true
  }
  private_cluster_config = {
    enable_private_endpoint = true
    master_global_access    = false
  }
}

module "hub" {
  source     = "./fabric/modules/gke-hub"
  project_id = module.project.project_id
  clusters = {
    cluster-1 = module.cluster_1.id
  }
  features = {
    appdevexperience             = false
    configmanagement             = true
    identityservice              = false
    multiclusteringress          = null
    servicemesh                  = false
    multiclusterservicediscovery = false
  }
  configmanagement_templates = {
    default = {
      binauthz = false
      config_sync = {
        git = {
          gcp_service_account_email = null
          https_proxy               = null
          policy_dir                = "configsync"
          secret_type               = "none"
          source_format             = "hierarchy"
          sync_branch               = "main"
          sync_repo                 = "https://github.com/danielmarzini/configsync-platform-example"
          sync_rev                  = null
          sync_wait_secs            = null
        }
        prevent_drift = false
        source_format = "hierarchy"
      }
      hierarchy_controller = {
        enable_hierarchical_resource_quota = true
        enable_pod_tree_labels             = true
      }
      policy_controller = {
        audit_interval_seconds     = 120
        exemptable_namespaces      = []
        log_denies_enabled         = true
        referential_rules_enabled  = true
        template_library_installed = true
      }
      version = "v1"
    }
  }
  configmanagement_clusters = {
    "default" = [ "cluster-1" ]
  }
}

# tftest modules=4 resources=15
```

## Multi-cluster mesh on GKE

```hcl
module "project" {
  source          = "./fabric/modules/project"
  billing_account = "123-456-789"
  name            = "gkehub-test"
  parent          = "folders/12345"
  services = [
    "anthos.googleapis.com",
    "container.googleapis.com",
    "gkehub.googleapis.com",
    "gkeconnect.googleapis.com",
    "mesh.googleapis.com",
    "meshconfig.googleapis.com",
    "meshca.googleapis.com"
  ]
}

module "vpc" {
  source     = "./fabric/modules/net-vpc"
  project_id = module.project.project_id
  name       = "vpc"
  mtu        = 1500
  subnets = [
    {
      ip_cidr_range = "10.0.1.0/24"
      name          = "subnet-cluster-1"
      region        = "europe-west1"
      secondary_ip_range = {
        pods     = "10.1.0.0/16"
        services = "10.2.0.0/24"
      }
    },
    {
      ip_cidr_range = "10.0.2.0/24"
      name          = "subnet-cluster-2"
      region        = "europe-west4"
      secondary_ip_range = {
        pods     = "10.3.0.0/16"
        services = "10.4.0.0/24"
      }
    },
    {
      ip_cidr_range      = "10.0.0.0/28"
      name               = "subnet-mgmt"
      region             = "europe-west1"
      secondary_ip_range = null
    }
  ]
}

module "firewall" {
  source     = "./fabric/modules/net-vpc-firewall"
  project_id = module.project.project_id
  network    = module.vpc.name
  ingress_rules = {
    allow-mesh = {
      description   = "Allow mesh"
      priority      = 900
      source_ranges = ["10.1.0.0/16", "10.3.0.0/16"]
      targets       = ["cluster-1-node", "cluster-2-node"]
    },
    "allow-cluster-1-istio" = {
      description   = "Allow istio sidecar injection, istioctl version and istioctl ps"
      source_ranges = ["192.168.1.0/28"]
      targets       = ["cluster-1-node"]
      rules = [
        { protocol = "tcp", ports = [8080, 15014, 15017] }
      ]
    },
    "allow-cluster-2-istio" = {
      description   = "Allow istio sidecar injection, istioctl version and istioctl ps"
      source_ranges = ["192.168.2.0/28"]
      targets       = ["cluster-2-node"]
      rules = [
        { protocol = "tcp", ports = [8080, 15014, 15017] }
      ]
    }
  }
}

module "cluster_1" {
  source     = "./fabric/modules/gke-cluster"
  project_id = module.project.project_id
  name       = "cluster-1"
  location   = "europe-west1"
  vpc_config = {
    network    = module.vpc.self_link
    subnetwork = module.vpc.subnet_self_links["europe-west1/subnet-cluster-1"]
    master_authorized_ranges = {
      mgmt           = "10.0.0.0/28"
      pods-cluster-1 = "10.3.0.0/16"
    }
    master_ipv4_cidr_block  = "192.168.1.0/28"
  }
  private_cluster_config = {
    enable_private_endpoint = false
    master_global_access    = true
  }
  release_channel = "REGULAR"
  labels = {
    mesh_id = "proj-${module.project.number}"
  }
}

module "cluster_1_nodepool" {
  source          = "./fabric/modules/gke-nodepool"
  project_id      = module.project.project_id
  cluster_name    = module.cluster_1.name
  location        = "europe-west1"
  name            = "nodepool"
  node_count      = { initial = 1 }
  service_account = { create = true }
  tags            = ["cluster-1-node"]
}

module "cluster_2" {
  source                   = "./fabric/modules/gke-cluster"
  project_id               = module.project.project_id
  name                     = "cluster-2"
  location                 = "europe-west4"
  vpc_config = {
    network    = module.vpc.self_link
    subnetwork = module.vpc.subnet_self_links["europe-west4/subnet-cluster-2"]
    master_authorized_ranges = {
      mgmt           = "10.0.0.0/28"
      pods-cluster-1 = "10.3.0.0/16"
    }
    master_ipv4_cidr_block  = "192.168.2.0/28"
  }
  private_cluster_config = {
    enable_private_endpoint = false
    master_global_access    = true
  }
  release_channel = "REGULAR"
  labels = {
    mesh_id = "proj-${module.project.number}"
  }
}

module "cluster_2_nodepool" {
  source                      = "./fabric/modules/gke-nodepool"
  project_id                  = module.project.project_id
  cluster_name                = module.cluster_2.name
  location                    = "europe-west4"
  name                        = "nodepool"
  node_count      = { initial = 1 }
  service_account = { create = true }
  tags            = ["cluster-2-node"]
}

module "hub" {
  source     = "./fabric/modules/gke-hub"
  project_id = module.project.project_id
  clusters = { 
    cluster-1 = module.cluster_1.id
    cluster-2 = module.cluster_2.id
  }
  features = {
    appdevexperience             = false
    configmanagement             = false
    identityservice              = false
    multiclusteringress          = null
    servicemesh                  = true
    multiclusterservicediscovery = false
  }
  workload_identity_clusters = [
    "cluster-1",
    "cluster-2"
  ]
}

# tftest modules=8 resources=28
```

<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [project_id](variables.tf#L87) | GKE hub project ID. | <code>string</code> | ✓ |  |
| [clusters](variables.tf#L17) | Clusters members of this GKE Hub in name => id format. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [configmanagement_clusters](variables.tf#L24) | Config management features enabled on specific sets of member clusters, in config name => [cluster name] format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [configmanagement_templates](variables.tf#L31) | Sets of config management configurations that can be applied to member clusters, in config name => {options} format. | <code title="map&#40;object&#40;&#123;&#10;  binauthz &#61; bool&#10;  config_sync &#61; object&#40;&#123;&#10;    git &#61; object&#40;&#123;&#10;      gcp_service_account_email &#61; string&#10;      https_proxy               &#61; string&#10;      policy_dir                &#61; string&#10;      secret_type               &#61; string&#10;      sync_branch               &#61; string&#10;      sync_repo                 &#61; string&#10;      sync_rev                  &#61; string&#10;      sync_wait_secs            &#61; number&#10;    &#125;&#41;&#10;    prevent_drift &#61; string&#10;    source_format &#61; string&#10;  &#125;&#41;&#10;  hierarchy_controller &#61; object&#40;&#123;&#10;    enable_hierarchical_resource_quota &#61; bool&#10;    enable_pod_tree_labels             &#61; bool&#10;  &#125;&#41;&#10;  policy_controller &#61; object&#40;&#123;&#10;    audit_interval_seconds     &#61; number&#10;    exemptable_namespaces      &#61; list&#40;string&#41;&#10;    log_denies_enabled         &#61; bool&#10;    referential_rules_enabled  &#61; bool&#10;    template_library_installed &#61; bool&#10;  &#125;&#41;&#10;  version &#61; string&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [features](variables.tf#L66) | Enable and configue fleet features. | <code title="object&#40;&#123;&#10;  appdevexperience             &#61; bool&#10;  configmanagement             &#61; bool&#10;  identityservice              &#61; bool&#10;  multiclusteringress          &#61; string&#10;  multiclusterservicediscovery &#61; bool&#10;  servicemesh                  &#61; bool&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  appdevexperience             &#61; false&#10;  configmanagement             &#61; false&#10;  identityservice              &#61; false&#10;  multiclusteringress          &#61; null&#10;  servicemesh                  &#61; false&#10;  multiclusterservicediscovery &#61; false&#10;&#125;">&#123;&#8230;&#125;</code> |
| [workload_identity_clusters](variables.tf#L92) | Clusters that will use Fleet Workload Identity. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [cluster_ids](outputs.tf#L17) |  |  |

<!-- END TFDOC -->
