# GCE Managed Instance Group module

This module allows creating a managed instance group supporting one or more application versions via instance templates. Optionally, a health check and an autoscaler can be created, and the managed instance group can be configured to be stateful.

This module can be coupled with the [`compute-vm`](../compute-vm) module which can manage instance templates, and the [`net-ilb`](../net-ilb) module to assign the MIG to a backend wired to an Internal Load Balancer. The first use case is shown in the examples below.

Stateful disks can be created directly, as shown in the last example below.

## Examples

This example shows how to manage a simple MIG that leverages the `compute-vm` module to manage the underlying instance template. The following sub-examples will only show how to enable specific features of this module, and won't replicate the combined setup.

```hcl
module "cos-nginx" {
  source = "./fabric/modules/cloud-config-container/nginx"
}

module "nginx-template" {
  source     = "./fabric/modules/compute-vm"
  project_id = var.project_id
  name       = "nginx-template"
  zone     = "europe-west1-b"
  tags       = ["http-server", "ssh"]
  network_interfaces = [{
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
    nat        = false
    addresses  = null
  }]
  boot_disk = {
    image = "projects/cos-cloud/global/images/family/cos-stable"
    type  = "pd-ssd"
    size  = 10
  }
  create_template = true
  metadata = {
    user-data = module.cos-nginx.cloud_config
  }
}

module "nginx-mig" {
  source            = "./fabric/modules/compute-mig"
  project_id        = "my-project"
  location          = "europe-west1-b"
  name              = "mig-test"
  target_size       = 2
  instance_template = module.nginx-template.template.self_link
}
# tftest modules=2 resources=2
```

### Multiple versions

If multiple versions are desired, use more `compute-vm` instances for the additional templates used in each version (not shown here), and reference them like this:

```hcl
module "cos-nginx" {
  source = "./fabric/modules/cloud-config-container/nginx"
}

module "nginx-template" {
  source     = "./fabric/modules/compute-vm"
  project_id = var.project_id
  name       = "nginx-template"
  zone     = "europe-west1-b"
  tags       = ["http-server", "ssh"]
  network_interfaces = [{
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
    nat        = false
    addresses  = null
  }]
  boot_disk = {
    image = "projects/cos-cloud/global/images/family/cos-stable"
    type  = "pd-ssd"
    size  = 10
  }
  create_template  = true
  metadata = {
    user-data = module.cos-nginx.cloud_config
  }
}

module "nginx-mig" {
  source            = "./fabric/modules/compute-mig"
  project_id        = "my-project"
  location          = "europe-west1-b"
  name              = "mig-test"
  target_size       = 3
  instance_template = module.nginx-template.template.self_link
  versions = {
    canary = {
      instance_template = module.nginx-template.template.self_link
      target_size = {
        fixed = 1
      }
    }
  }
}
# tftest modules=2 resources=2
```

### Health check and autohealing policies

Autohealing policies can use an externally defined health check, or have this module auto-create one:

```hcl
module "cos-nginx" {
  source = "./fabric/modules/cloud-config-container/nginx"
}

module "nginx-template" {
  source     = "./fabric/modules/compute-vm"
  project_id = var.project_id
  name       = "nginx-template"
  zone     = "europe-west1-b"
  tags       = ["http-server", "ssh"]
  network_interfaces = [{
    network    = var.vpc.self_link,
    subnetwork = var.subnet.self_link,
    nat        = false,
    addresses  = null
  }]
  boot_disk = {
    image = "projects/cos-cloud/global/images/family/cos-stable"
    type  = "pd-ssd"
    size  = 10
  }
  create_template  = true
  metadata = {
    user-data = module.cos-nginx.cloud_config
  }
}

module "nginx-mig" {
  source            = "./fabric/modules/compute-mig"
  project_id        = "my-project"
  location          = "europe-west1-b"
  name              = "mig-test"
  target_size       = 3
  instance_template = module.nginx-template.template.self_link
  auto_healing_policies = {
    initial_delay_sec = 30
  }
  health_check_config = {
    enable_logging = true
    http = {
      port = 80
    }
  }
}
# tftest modules=2 resources=3
```

### Autoscaling

The module can create and manage an autoscaler associated with the MIG. When using autoscaling do not set the `target_size` variable or set it to `null`. Here we show a CPU utilization autoscaler, the other available modes are load balancing utilization and custom metric, like the underlying autoscaler resource.

```hcl
module "cos-nginx" {
  source = "./fabric/modules/cloud-config-container/nginx"
}

module "nginx-template" {
  source     = "./fabric/modules/compute-vm"
  project_id = var.project_id
  name       = "nginx-template"
  zone     = "europe-west1-b"
  tags       = ["http-server", "ssh"]
  network_interfaces = [{
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
    nat        = false
    addresses  = null
  }]
  boot_disk = {
    image = "projects/cos-cloud/global/images/family/cos-stable"
    type  = "pd-ssd"
    size  = 10
  }
  create_template  = true
  metadata = {
    user-data = module.cos-nginx.cloud_config
  }
}

module "nginx-mig" {
  source            = "./fabric/modules/compute-mig"
  project_id        = "my-project"
  location          = "europe-west1-b"
  name              = "mig-test"
  target_size       = 3
  instance_template = module.nginx-template.template.self_link
  autoscaler_config = {
    max_replicas    = 3
    min_replicas    = 1
    cooldown_period = 30
    scaling_signals = {
      cpu_utilization = {
        target = 0.65
      }
    }
  }
}
# tftest modules=2 resources=3
```

### Update policy

```hcl
module "cos-nginx" {
  source = "./fabric/modules/cloud-config-container/nginx"
}

module "nginx-template" {
  source     = "./fabric/modules/compute-vm"
  project_id = var.project_id
  name       = "nginx-template"
  zone     = "europe-west1-b"
  tags       = ["http-server", "ssh"]
  network_interfaces = [{
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
    nat        = false
    addresses  = null
  }]
  boot_disk = {
    image = "projects/cos-cloud/global/images/family/cos-stable"
    type  = "pd-ssd"
    size  = 10
  }
  create_template  = true
  metadata = {
    user-data = module.cos-nginx.cloud_config
  }
}

module "nginx-mig" {
  source            = "./fabric/modules/compute-mig"
  project_id        = "my-project"
  location          = "europe-west1-b"
  name              = "mig-test"
  target_size       = 3
  instance_template = module.nginx-template.template.self_link
  update_policy = {
    minimal_action       = "REPLACE"
    type                 = "PROACTIVE"
    min_ready_sec        = 30
    max_surge = {
      fixed = 1
    }
  }
}
# tftest modules=2 resources=2
```

### Stateful MIGs - MIG Config

Stateful MIGs have some limitations documented [here](https://cloud.google.com/compute/docs/instance-groups/configuring-stateful-migs#limitations). Enforcement of these requirements is the responsibility of users of this module.

You can configure a disk defined in the instance template to be stateful  for all instances in the MIG by configuring in the MIG's stateful policy, using the `stateful_disk_mig` variable. Alternatively, you can also configure stateful persistent disks individually per instance of the MIG by setting the `stateful_disk_instance` variable. A discussion on these scenarios can be found in the [docs](https://cloud.google.com/compute/docs/instance-groups/configuring-stateful-disks-in-migs).

An example using only the configuration at the MIG level can be seen below.

Note that when referencing the stateful disk, you use `device_name` and not `disk_name`.

```hcl
module "cos-nginx" {
  source = "./fabric/modules/cloud-config-container/nginx"
}

module "nginx-template" {
  source     = "./fabric/modules/compute-vm"
  project_id = var.project_id
  name       = "nginx-template"
  zone     = "europe-west1-b"
  tags       = ["http-server", "ssh"]
  network_interfaces = [{
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
    nat        = false
    addresses  = null
  }]
  boot_disk = {
    image = "projects/cos-cloud/global/images/family/cos-stable"
    type  = "pd-ssd"
    size  = 10
  }
  attached_disks = [{
    name        = "repd-1"
    size        = null
    source_type = "attach"
    source      = "regions/${var.region}/disks/repd-test-1"
    options = {
      mode         = "READ_ONLY"
      replica_zone = "${var.region}-c"
      type         = "PERSISTENT"
    }
  }]
  create_template  = true
  metadata = {
    user-data = module.cos-nginx.cloud_config
  }
}

module "nginx-mig" {
  source            = "./fabric/modules/compute-mig"
  project_id        = "my-project"
  location          = "europe-west1-b"
  name              = "mig-test"
  target_size       = 3
  instance_template = module.nginx-template.template.self_link
  autoscaler_config = {
    max_replicas    = 3
    min_replicas    = 1
    cooldown_period = 30
    scaling_signals = {
      cpu_utilization = {
        target = 0.65
      }
    }
  }
  stateful_disks = {
    repd-1 = null
  }
}
# tftest modules=2 resources=3

```

### Stateful MIGs - Instance Config

Here is an example defining the stateful config at the instance level.

Note that you will need to know the instance name in order to use this configuration.

```hcl
module "cos-nginx" {
  source = "./fabric/modules/cloud-config-container/nginx"
}

module "nginx-template" {
  source     = "./fabric/modules/compute-vm"
  project_id = var.project_id
  name       = "nginx-template"
  zone     = "europe-west1-b"
  tags       = ["http-server", "ssh"]
  network_interfaces = [{
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
    nat        = false
    addresses  = null
  }]
  boot_disk = {
    image = "projects/cos-cloud/global/images/family/cos-stable"
    type  = "pd-ssd"
    size  = 10
  }
  attached_disks = [{
    name        = "repd-1"
    size        = null
    source_type = "attach"
    source      = "regions/${var.region}/disks/repd-test-1"
    options = {
      mode         = "READ_ONLY"
      replica_zone = "${var.region}-c"
      type         = "PERSISTENT"
    }
  }]
  create_template  = true
  metadata = {
    user-data = module.cos-nginx.cloud_config
  }
}

module "nginx-mig" {
  source            = "./fabric/modules/compute-mig"
  project_id        = "my-project"
  location          = "europe-west1-b"
  name              = "mig-test"
  target_size       = 3
  instance_template = module.nginx-template.template.self_link
  autoscaler_config = {
    max_replicas    = 3
    min_replicas    = 1
    cooldown_period = 30
    scaling_signals = {
      cpu_utilization = {
        target = 0.65
      }
    }
  }
  stateful_config = {
    # name needs to match a MIG instance name
    instance-1 = {
      minimal_action                   = "NONE",
      most_disruptive_allowed_action   = "REPLACE"
      preserved_state = {
        disks = {
          persistent-disk-1 = {
            source = "test-disk", 
          }
        }
        metadata = {
          foo = "bar"
        }
      }
    }
  }
}
# tftest modules=2 resources=4

```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [instance_template](variables.tf#L174) | Instance template for the default version. | <code>string</code> | ✓ |  |
| [location](variables.tf#L179) | Compute zone or region. | <code>string</code> | ✓ |  |
| [name](variables.tf#L184) | Managed group name. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L195) | Project id. | <code>string</code> | ✓ |  |
| [all_instances_config](variables.tf#L17) | Metadata and labels set to all instances in the group. | <code title="object&#40;&#123;&#10;  labels   &#61; optional&#40;map&#40;string&#41;&#41;&#10;  metadata &#61; optional&#40;map&#40;string&#41;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [auto_healing_policies](variables.tf#L26) | Auto-healing policies for this group. | <code title="object&#40;&#123;&#10;  health_check      &#61; optional&#40;string&#41;&#10;  initial_delay_sec &#61; number&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [autoscaler_config](variables.tf#L35) | Optional autoscaler configuration. | <code title="object&#40;&#123;&#10;  max_replicas    &#61; number&#10;  min_replicas    &#61; number&#10;  cooldown_period &#61; optional&#40;number&#41;&#10;  mode            &#61; optional&#40;string&#41; &#35; OFF, ONLY_UP, ON&#10;  scaling_control &#61; optional&#40;object&#40;&#123;&#10;    down &#61; optional&#40;object&#40;&#123;&#10;      max_replicas_fixed   &#61; optional&#40;number&#41;&#10;      max_replicas_percent &#61; optional&#40;number&#41;&#10;      time_window_sec      &#61; optional&#40;number&#41;&#10;    &#125;&#41;&#41;&#10;    in &#61; optional&#40;object&#40;&#123;&#10;      max_replicas_fixed   &#61; optional&#40;number&#41;&#10;      max_replicas_percent &#61; optional&#40;number&#41;&#10;      time_window_sec      &#61; optional&#40;number&#41;&#10;    &#125;&#41;&#41;&#10;  &#125;&#41;, &#123;&#125;&#41;&#10;  scaling_signals &#61; optional&#40;object&#40;&#123;&#10;    cpu_utilization &#61; optional&#40;object&#40;&#123;&#10;      target                &#61; number&#10;      optimize_availability &#61; optional&#40;bool&#41;&#10;    &#125;&#41;&#41;&#10;    load_balancing_utilization &#61; optional&#40;object&#40;&#123;&#10;      target &#61; number&#10;    &#125;&#41;&#41;&#10;    metrics &#61; optional&#40;list&#40;object&#40;&#123;&#10;      name                       &#61; string&#10;      type                       &#61; string &#35; GAUGE, DELTA_PER_SECOND, DELTA_PER_MINUTE&#10;      target_value               &#61; number&#10;      single_instance_assignment &#61; optional&#40;number&#41;&#10;      time_series_filter         &#61; optional&#40;string&#41;&#10;    &#125;&#41;&#41;&#41;&#10;    schedules &#61; optional&#40;list&#40;object&#40;&#123;&#10;      duration_sec          &#61; number&#10;      name                  &#61; string&#10;      min_required_replicas &#61; number&#10;      cron_schedule         &#61; string&#10;      description           &#61; optional&#40;bool&#41;&#10;      timezone              &#61; optional&#40;string&#41;&#10;      disabled              &#61; optional&#40;bool&#41;&#10;    &#125;&#41;&#41;&#41;&#10;  &#125;&#41;, &#123;&#125;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [default_version_name](variables.tf#L83) | Name used for the default version. | <code>string</code> |  | <code>&#34;default&#34;</code> |
| [description](variables.tf#L89) | Optional description used for all resources managed by this module. | <code>string</code> |  | <code>&#34;Terraform managed.&#34;</code> |
| [distribution_policy](variables.tf#L95) | DIstribution policy for regional MIG. | <code title="object&#40;&#123;&#10;  target_shape &#61; optional&#40;string&#41;&#10;  zones        &#61; optional&#40;list&#40;string&#41;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [health_check_config](variables.tf#L104) | Optional auto-created health check configuration, use the output self-link to set it in the auto healing policy. Refer to examples for usage. | <code title="object&#40;&#123;&#10;  check_interval_sec  &#61; optional&#40;number&#41;&#10;  description         &#61; optional&#40;string, &#34;Terraform managed.&#34;&#41;&#10;  enable_logging      &#61; optional&#40;bool, false&#41;&#10;  healthy_threshold   &#61; optional&#40;number&#41;&#10;  timeout_sec         &#61; optional&#40;number&#41;&#10;  unhealthy_threshold &#61; optional&#40;number&#41;&#10;  grpc &#61; optional&#40;object&#40;&#123;&#10;    port               &#61; optional&#40;number&#41;&#10;    port_name          &#61; optional&#40;string&#41;&#10;    port_specification &#61; optional&#40;string&#41; &#35; USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT&#10;    service_name       &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;  http &#61; optional&#40;object&#40;&#123;&#10;    host               &#61; optional&#40;string&#41;&#10;    port               &#61; optional&#40;number&#41;&#10;    port_name          &#61; optional&#40;string&#41;&#10;    port_specification &#61; optional&#40;string&#41; &#35; USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT&#10;    proxy_header       &#61; optional&#40;string&#41;&#10;    request_path       &#61; optional&#40;string&#41;&#10;    response           &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;  http2 &#61; optional&#40;object&#40;&#123;&#10;    host               &#61; optional&#40;string&#41;&#10;    port               &#61; optional&#40;number&#41;&#10;    port_name          &#61; optional&#40;string&#41;&#10;    port_specification &#61; optional&#40;string&#41; &#35; USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT&#10;    proxy_header       &#61; optional&#40;string&#41;&#10;    request_path       &#61; optional&#40;string&#41;&#10;    response           &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;  https &#61; optional&#40;object&#40;&#123;&#10;    host               &#61; optional&#40;string&#41;&#10;    port               &#61; optional&#40;number&#41;&#10;    port_name          &#61; optional&#40;string&#41;&#10;    port_specification &#61; optional&#40;string&#41; &#35; USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT&#10;    proxy_header       &#61; optional&#40;string&#41;&#10;    request_path       &#61; optional&#40;string&#41;&#10;    response           &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;  tcp &#61; optional&#40;object&#40;&#123;&#10;    port               &#61; optional&#40;number&#41;&#10;    port_name          &#61; optional&#40;string&#41;&#10;    port_specification &#61; optional&#40;string&#41; &#35; USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT&#10;    proxy_header       &#61; optional&#40;string&#41;&#10;    request            &#61; optional&#40;string&#41;&#10;    response           &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;  ssl &#61; optional&#40;object&#40;&#123;&#10;    port               &#61; optional&#40;number&#41;&#10;    port_name          &#61; optional&#40;string&#41;&#10;    port_specification &#61; optional&#40;string&#41; &#35; USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT&#10;    proxy_header       &#61; optional&#40;string&#41;&#10;    request            &#61; optional&#40;string&#41;&#10;    response           &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [named_ports](variables.tf#L189) | Named ports. | <code>map&#40;number&#41;</code> |  | <code>null</code> |
| [stateful_config](variables.tf#L207) | Stateful configuration for individual instances. | <code title="map&#40;object&#40;&#123;&#10;  minimal_action          &#61; optional&#40;string&#41;&#10;  most_disruptive_action  &#61; optional&#40;string&#41;&#10;  remove_state_on_destroy &#61; optional&#40;bool&#41;&#10;  preserved_state &#61; optional&#40;object&#40;&#123;&#10;    disks &#61; optional&#40;map&#40;object&#40;&#123;&#10;      source                      &#61; string&#10;      delete_on_instance_deletion &#61; optional&#40;bool&#41;&#10;      read_only                   &#61; optional&#40;bool&#41;&#10;    &#125;&#41;&#41;&#41;&#10;    metadata &#61; optional&#40;map&#40;string&#41;&#41;&#10;  &#125;&#41;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [stateful_disks](variables.tf#L200) | Stateful disk configuration applied at the MIG level to all instances, in device name => on permanent instance delete rule as boolean. | <code>map&#40;bool&#41;</code> |  | <code>&#123;&#125;</code> |
| [target_pools](variables.tf#L226) | Optional list of URLs for target pools to which new instances in the group are added. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [target_size](variables.tf#L232) | Group target size, leave null when using an autoscaler. | <code>number</code> |  | <code>null</code> |
| [update_policy](variables.tf#L238) | Update policy. Minimal action and type are required. | <code title="object&#40;&#123;&#10;  minimal_action &#61; string&#10;  type           &#61; string&#10;  max_surge &#61; optional&#40;object&#40;&#123;&#10;    fixed   &#61; optional&#40;number&#41;&#10;    percent &#61; optional&#40;number&#41;&#10;  &#125;&#41;&#41;&#10;  max_unavailable &#61; optional&#40;object&#40;&#123;&#10;    fixed   &#61; optional&#40;number&#41;&#10;    percent &#61; optional&#40;number&#41;&#10;  &#125;&#41;&#41;&#10;  min_ready_sec                &#61; optional&#40;number&#41;&#10;  most_disruptive_action       &#61; optional&#40;string&#41;&#10;  regional_redistribution_type &#61; optional&#40;string&#41;&#10;  replacement_method           &#61; optional&#40;string&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [versions](variables.tf#L259) | Additional application versions, target_size is optional. | <code title="map&#40;object&#40;&#123;&#10;  instance_template &#61; string&#10;  target_size &#61; optional&#40;object&#40;&#123;&#10;    fixed   &#61; optional&#40;number&#41;&#10;    percent &#61; optional&#40;number&#41;&#10;  &#125;&#41;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [wait_for_instances](variables.tf#L272) | Wait for all instances to be created/updated before returning. | <code title="object&#40;&#123;&#10;  enabled &#61; bool&#10;  status  &#61; optional&#40;string&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [autoscaler](outputs.tf#L17) | Auto-created autoscaler resource. |  |
| [group_manager](outputs.tf#L26) | Instance group resource. |  |
| [health_check](outputs.tf#L35) | Auto-created health-check resource. |  |

<!-- END TFDOC -->
