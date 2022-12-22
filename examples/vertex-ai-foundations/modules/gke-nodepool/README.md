# GKE nodepool module

This module allows simplified creation and management of individual GKE nodepools, setting sensible defaults (eg a service account is created for nodes if none is set) and allowing for less verbose usage in most use cases.

## Example usage

### Module defaults

If no specific node configuration is set via variables, the module uses the provider's defaults only setting OAuth scopes to a minimal working set and the node machine type to `n1-standard-1`. The service account set by the provider in this case is the GCE default service account.

```hcl
module "cluster-1-nodepool-1" {
  source        = "./fabric/modules/gke-nodepool"
  project_id    = "myproject"
  cluster_name  = "cluster-1"
  location      = "europe-west1-b"
  name          = "nodepool-1"
}
# tftest modules=1 resources=1
```

### Internally managed service account

There are three different approaches to defining the nodes service account, all depending on the `service_account` variable where the `create` attribute controls creation of a new service account by this module, and the `email` attribute controls the actual service account to use.

If you create a new service account, its resource and email (in both plain and IAM formats) are then available in outputs to reference it in other modules or resources.

#### GCE default service account

To use the GCE default service account, you can ignore the variable which is equivalent to `{ create = null, email = null }`.

```hcl
module "cluster-1-nodepool-1" {
  source          = "./fabric/modules/gke-nodepool"
  project_id      = "myproject"
  cluster_name    = "cluster-1"
  location        = "europe-west1-b"
  name            = "nodepool-1"
}
# tftest modules=1 resources=1
```

#### Externally defined service account

To use an existing service account, pass in just the `email` attribute.

```hcl
module "cluster-1-nodepool-1" {
  source          = "./fabric/modules/gke-nodepool"
  project_id      = "myproject"
  cluster_name    = "cluster-1"
  location        = "europe-west1-b"
  name            = "nodepool-1"
  service_account = {
    email = "foo-bar@myproject.iam.gserviceaccount.com"
  }
}
# tftest modules=1 resources=1
```

#### Auto-created service account

To have the module create a service account, set the `create` attribute to `true` and optionally pass the desired account id in `email`.

```hcl
module "cluster-1-nodepool-1" {
  source          = "./fabric/modules/gke-nodepool"
  project_id      = "myproject"
  cluster_name    = "cluster-1"
  location        = "europe-west1-b"
  name            = "nodepool-1"
  service_account = {
    create = true
    # optional
    email = "spam-eggs"
  }
}
# tftest modules=1 resources=2
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [cluster_name](variables.tf#L17) | Cluster name. | <code>string</code> | ✓ |  |
| [location](variables.tf#L35) | Cluster location. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L143) | Cluster project id. | <code>string</code> | ✓ |  |
| [gke_version](variables.tf#L22) | Kubernetes nodes version. Ignored if auto_upgrade is set in management_config. | <code>string</code> |  | <code>null</code> |
| [labels](variables.tf#L28) | Kubernetes labels applied to each node. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [max_pods_per_node](variables.tf#L40) | Maximum number of pods per node. | <code>number</code> |  | <code>null</code> |
| [name](variables.tf#L46) | Optional nodepool name. | <code>string</code> |  | <code>null</code> |
| [node_config](variables.tf#L52) | Node-level configuration. | <code title="object&#40;&#123;&#10;  boot_disk_kms_key   &#61; optional&#40;string&#41;&#10;  disk_size_gb        &#61; optional&#40;number&#41;&#10;  disk_type           &#61; optional&#40;string&#41;&#10;  ephemeral_ssd_count &#61; optional&#40;number&#41;&#10;  gcfs                &#61; optional&#40;bool, false&#41;&#10;  guest_accelerator &#61; optional&#40;object&#40;&#123;&#10;    count              &#61; number&#10;    type               &#61; string&#10;    gpu_partition_size &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;  gvnic      &#61; optional&#40;bool, false&#41;&#10;  image_type &#61; optional&#40;string&#41;&#10;  kubelet_config &#61; optional&#40;object&#40;&#123;&#10;    cpu_manager_policy   &#61; string&#10;    cpu_cfs_quota        &#61; optional&#40;bool&#41;&#10;    cpu_cfs_quota_period &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;  linux_node_config_sysctls &#61; optional&#40;map&#40;string&#41;&#41;&#10;  local_ssd_count           &#61; optional&#40;number&#41;&#10;  machine_type              &#61; optional&#40;string&#41;&#10;  metadata                  &#61; optional&#40;map&#40;string&#41;&#41;&#10;  min_cpu_platform          &#61; optional&#40;string&#41;&#10;  preemptible               &#61; optional&#40;bool&#41;&#10;  sandbox_config_gvisor     &#61; optional&#40;bool&#41;&#10;  shielded_instance_config &#61; optional&#40;object&#40;&#123;&#10;    enable_integrity_monitoring &#61; optional&#40;bool&#41;&#10;    enable_secure_boot          &#61; optional&#40;bool&#41;&#10;  &#125;&#41;&#41;&#10;  spot                          &#61; optional&#40;bool&#41;&#10;  workload_metadata_config_mode &#61; optional&#40;string&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  disk_type &#61; &#34;pd-balanced&#34;&#10;&#125;">&#123;&#8230;&#125;</code> |
| [node_count](variables.tf#L91) | Number of nodes per instance group. Initial value can only be changed by recreation, current is ignored when autoscaling is used. | <code title="object&#40;&#123;&#10;  current &#61; optional&#40;number&#41;&#10;  initial &#61; number&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  initial &#61; 1&#10;&#125;">&#123;&#8230;&#125;</code> |
| [node_locations](variables.tf#L103) | Node locations. | <code>list&#40;string&#41;</code> |  | <code>null</code> |
| [nodepool_config](variables.tf#L109) | Nodepool-level configuration. | <code title="object&#40;&#123;&#10;  autoscaling &#61; optional&#40;object&#40;&#123;&#10;    location_policy &#61; optional&#40;string&#41;&#10;    max_node_count  &#61; optional&#40;number&#41;&#10;    min_node_count  &#61; optional&#40;number&#41;&#10;    use_total_nodes &#61; optional&#40;bool, false&#41;&#10;  &#125;&#41;&#41;&#10;  management &#61; optional&#40;object&#40;&#123;&#10;    auto_repair  &#61; optional&#40;bool&#41;&#10;    auto_upgrade &#61; optional&#40;bool&#41;&#10;  &#125;&#41;&#41;&#10;  upgrade_settings &#61; optional&#40;object&#40;&#123;&#10;    max_surge       &#61; number&#10;    max_unavailable &#61; number&#10;  &#125;&#41;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [pod_range](variables.tf#L131) | Pod secondary range configuration. | <code title="object&#40;&#123;&#10;  secondary_pod_range &#61; object&#40;&#123;&#10;    cidr   &#61; optional&#40;string&#41;&#10;    create &#61; optional&#40;bool&#41;&#10;    name   &#61; string&#10;  &#125;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [reservation_affinity](variables.tf#L148) | Configuration of the desired reservation which instances could take capacity from. | <code title="object&#40;&#123;&#10;  consume_reservation_type &#61; string&#10;  key                      &#61; optional&#40;string&#41;&#10;  values                   &#61; optional&#40;list&#40;string&#41;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [service_account](variables.tf#L158) | Nodepool service account. If this variable is set to null, the default GCE service account will be used. If set and email is null, a service account will be created. If scopes are null a default will be used. | <code title="object&#40;&#123;&#10;  create       &#61; optional&#40;bool, false&#41;&#10;  email        &#61; optional&#40;string, null&#41;&#10;  oauth_scopes &#61; optional&#40;list&#40;string&#41;, null&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>&#123;&#125;</code> |
| [sole_tenant_nodegroup](variables.tf#L169) | Sole tenant node group. | <code>string</code> |  | <code>null</code> |
| [tags](variables.tf#L175) | Network tags applied to nodes. | <code>list&#40;string&#41;</code> |  | <code>null</code> |
| [taints](variables.tf#L181) | Kubernetes taints applied to all nodes. | <code title="list&#40;object&#40;&#123;&#10;  key    &#61; string&#10;  value  &#61; string&#10;  effect &#61; string&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [name](outputs.tf#L17) | Nodepool name. |  |
| [service_account_email](outputs.tf#L22) | Service account email. |  |
| [service_account_iam_email](outputs.tf#L27) | Service account email. |  |

<!-- END TFDOC -->
