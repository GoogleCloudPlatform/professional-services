# GKE cluster module

This module allows simplified creation and management of GKE clusters and should be used together with the GKE nodepool module, as the default nodepool is turned off here and cannot be re-enabled. Some sensible defaults are set initially, in order to allow less verbose usage for most use cases.

## Example

### GKE Cluster

```hcl
module "cluster-1" {
  source     = "./fabric/modules/gke-cluster"
  project_id = "myproject"
  name       = "cluster-1"
  location   = "europe-west1-b"
  vpc_config = {
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
    secondary_range_names = {
      pods     = "pods"
      services = "services"
    }
    master_authorized_ranges = {
      internal-vms = "10.0.0.0/8"
    }
    master_ipv4_cidr_block  = "192.168.0.0/28"
  }
  max_pods_per_node = 32
  private_cluster_config = {
    enable_private_endpoint = true
    master_global_access    = false
  }
  labels = {
    environment = "dev"
  }
}
# tftest modules=1 resources=1
```

### GKE Cluster with Dataplane V2 enabled

```hcl
module "cluster-1" {
  source     = "./fabric/modules/gke-cluster"
  project_id = "myproject"
  name       = "cluster-1"
  location   = "europe-west1-b"
  vpc_config = {
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
    secondary_range_names = {
      pods     = "pods"
      services = "services"
    }
    master_authorized_ranges = {
      internal-vms = "10.0.0.0/8"
    }
    master_ipv4_cidr_block  = "192.168.0.0/28"
  }
  private_cluster_config = {
    enable_private_endpoint = true
    master_global_access    = false
  }
  enable_features = {
    dataplane_v2      = true
    workload_identity = true
  }
  labels = {
    environment = "dev"
  }
}
# tftest modules=1 resources=1
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [location](variables.tf#L117) | Cluster zone or region. | <code>string</code> | ✓ |  |
| [name](variables.tf#L174) | Cluster name. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L200) | Cluster project id. | <code>string</code> | ✓ |  |
| [vpc_config](variables.tf#L211) | VPC-level configuration. | <code title="object&#40;&#123;&#10;  network                &#61; string&#10;  subnetwork             &#61; string&#10;  master_ipv4_cidr_block &#61; optional&#40;string&#41;&#10;  secondary_range_blocks &#61; optional&#40;object&#40;&#123;&#10;    pods     &#61; string&#10;    services &#61; string&#10;  &#125;&#41;&#41;&#10;  secondary_range_names &#61; optional&#40;object&#40;&#123;&#10;    pods     &#61; string&#10;    services &#61; string&#10;  &#125;&#41;, &#123; pods &#61; &#34;pods&#34;, services &#61; &#34;services&#34; &#125;&#41;&#10;  master_authorized_ranges &#61; optional&#40;map&#40;string&#41;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> | ✓ |  |
| [cluster_autoscaling](variables.tf#L17) | Enable and configure limits for Node Auto-Provisioning with Cluster Autoscaler. | <code title="object&#40;&#123;&#10;  auto_provisioning_defaults &#61; optional&#40;object&#40;&#123;&#10;    boot_disk_kms_key &#61; optional&#40;string&#41;&#10;    image_type        &#61; optional&#40;string&#41;&#10;    oauth_scopes      &#61; optional&#40;list&#40;string&#41;&#41;&#10;    service_account   &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;  cpu_limits &#61; optional&#40;object&#40;&#123;&#10;    min &#61; number&#10;    max &#61; number&#10;  &#125;&#41;&#41;&#10;  mem_limits &#61; optional&#40;object&#40;&#123;&#10;    min &#61; number&#10;    max &#61; number&#10;  &#125;&#41;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [description](variables.tf#L38) | Cluster description. | <code>string</code> |  | <code>null</code> |
| [enable_addons](variables.tf#L44) | Addons enabled in the cluster (true means enabled). | <code title="object&#40;&#123;&#10;  cloudrun                       &#61; optional&#40;bool, false&#41;&#10;  config_connector               &#61; optional&#40;bool, false&#41;&#10;  dns_cache                      &#61; optional&#40;bool, false&#41;&#10;  gce_persistent_disk_csi_driver &#61; optional&#40;bool, false&#41;&#10;  gcp_filestore_csi_driver       &#61; optional&#40;bool, false&#41;&#10;  gke_backup_agent               &#61; optional&#40;bool, false&#41;&#10;  horizontal_pod_autoscaling     &#61; optional&#40;bool, false&#41;&#10;  http_load_balancing            &#61; optional&#40;bool, false&#41;&#10;  istio &#61; optional&#40;object&#40;&#123;&#10;    enable_tls &#61; bool&#10;  &#125;&#41;&#41;&#10;  kalm           &#61; optional&#40;bool, false&#41;&#10;  network_policy &#61; optional&#40;bool, false&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  horizontal_pod_autoscaling &#61; true&#10;  http_load_balancing        &#61; true&#10;&#125;">&#123;&#8230;&#125;</code> |
| [enable_features](variables.tf#L68) | Enable cluster-level features. Certain features allow configuration. | <code title="object&#40;&#123;&#10;  autopilot            &#61; optional&#40;bool, false&#41;&#10;  binary_authorization &#61; optional&#40;bool, false&#41;&#10;  cloud_dns &#61; optional&#40;object&#40;&#123;&#10;    provider &#61; optional&#40;string&#41;&#10;    scope    &#61; optional&#40;string&#41;&#10;    domain   &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;  database_encryption &#61; optional&#40;object&#40;&#123;&#10;    state    &#61; string&#10;    key_name &#61; string&#10;  &#125;&#41;&#41;&#10;  dataplane_v2         &#61; optional&#40;bool, false&#41;&#10;  groups_for_rbac      &#61; optional&#40;string&#41;&#10;  intranode_visibility &#61; optional&#40;bool, false&#41;&#10;  l4_ilb_subsetting    &#61; optional&#40;bool, false&#41;&#10;  pod_security_policy  &#61; optional&#40;bool, false&#41;&#10;  resource_usage_export &#61; optional&#40;object&#40;&#123;&#10;    dataset                              &#61; string&#10;    enable_network_egress_metering       &#61; optional&#40;bool&#41;&#10;    enable_resource_consumption_metering &#61; optional&#40;bool&#41;&#10;  &#125;&#41;&#41;&#10;  shielded_nodes &#61; optional&#40;bool, false&#41;&#10;  tpu            &#61; optional&#40;bool, false&#41;&#10;  upgrade_notifications &#61; optional&#40;object&#40;&#123;&#10;    topic_id &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;  vertical_pod_autoscaling &#61; optional&#40;bool, false&#41;&#10;  workload_identity        &#61; optional&#40;bool, false&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  workload_identity &#61; true&#10;&#125;">&#123;&#8230;&#125;</code> |
| [issue_client_certificate](variables.tf#L105) | Enable issuing client certificate. | <code>bool</code> |  | <code>false</code> |
| [labels](variables.tf#L111) | Cluster resource labels. | <code>map&#40;string&#41;</code> |  | <code>null</code> |
| [logging_config](variables.tf#L122) | Logging configuration. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#34;SYSTEM_COMPONENTS&#34;&#93;</code> |
| [maintenance_config](variables.tf#L128) | Maintenance window configuration. | <code title="object&#40;&#123;&#10;  daily_window_start_time &#61; optional&#40;string&#41;&#10;  recurring_window &#61; optional&#40;object&#40;&#123;&#10;    start_time &#61; string&#10;    end_time   &#61; string&#10;    recurrence &#61; string&#10;  &#125;&#41;&#41;&#10;  maintenance_exclusions &#61; optional&#40;list&#40;object&#40;&#123;&#10;    name       &#61; string&#10;    start_time &#61; string&#10;    end_time   &#61; string&#10;    scope      &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  daily_window_start_time &#61; &#34;03:00&#34;&#10;  recurring_window        &#61; null&#10;  maintenance_exclusion   &#61; &#91;&#93;&#10;&#125;">&#123;&#8230;&#125;</code> |
| [max_pods_per_node](variables.tf#L151) | Maximum number of pods per node in this cluster. | <code>number</code> |  | <code>110</code> |
| [min_master_version](variables.tf#L157) | Minimum version of the master, defaults to the version of the most recent official release. | <code>string</code> |  | <code>null</code> |
| [monitoring_config](variables.tf#L163) | Monitoring components. | <code title="object&#40;&#123;&#10;  enable_components  &#61; optional&#40;list&#40;string&#41;&#41;&#10;  managed_prometheus &#61; optional&#40;bool&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  enable_components &#61; &#91;&#34;SYSTEM_COMPONENTS&#34;&#93;&#10;&#125;">&#123;&#8230;&#125;</code> |
| [node_locations](variables.tf#L179) | Zones in which the cluster's nodes are located. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [private_cluster_config](variables.tf#L186) | Private cluster configuration. | <code title="object&#40;&#123;&#10;  enable_private_endpoint &#61; optional&#40;bool&#41;&#10;  master_global_access    &#61; optional&#40;bool&#41;&#10;  peering_config &#61; optional&#40;object&#40;&#123;&#10;    export_routes &#61; optional&#40;bool&#41;&#10;    import_routes &#61; optional&#40;bool&#41;&#10;    project_id    &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [release_channel](variables.tf#L205) | Release channel for GKE upgrades. | <code>string</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [ca_certificate](outputs.tf#L17) | Public certificate of the cluster (base64-encoded). | ✓ |
| [cluster](outputs.tf#L23) | Cluster resource. | ✓ |
| [endpoint](outputs.tf#L29) | Cluster endpoint. |  |
| [id](outputs.tf#L34) | Cluster ID. |  |
| [location](outputs.tf#L39) | Cluster location. |  |
| [master_version](outputs.tf#L44) | Master version. |  |
| [name](outputs.tf#L49) | Cluster name. |  |
| [notifications](outputs.tf#L54) | GKE PubSub notifications topic. |  |
| [self_link](outputs.tf#L59) | Cluster self link. | ✓ |

<!-- END TFDOC -->
