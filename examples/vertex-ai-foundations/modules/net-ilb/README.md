# Internal Load Balancer Module

This module allows managing a GCE Internal Load Balancer and integrates the forwarding rule, regional backend, and optional health check resources. It's designed to be a simple match for the [`compute-vm`](../compute-vm) module, which can be used to manage instance templates and instance groups.

## Issues

TODO(ludoo): check if this is still the case after splitting out MIG from compute-vm

There are some corner cases (eg when switching the instance template from internal service account to an externally managed one) where Terraform raises a cycle error on apply. In these situations, run successive applies targeting resources used in the template first then the template itself, and the cycle should be fixed.

One other issue is a `Provider produced inconsistent final plan` error which is sometimes raised when switching template version. This seems to be related to this [open provider issue](https://github.com/terraform-providers/terraform-provider-google/issues/3937), but it's relatively harmless since the resource is updated, and subsequent applies raise no errors.

## Examples

### Externally managed instances

This examples shows how to create an ILB by combining externally managed instances (in a custom module or even outside of the current root module) in an unmanaged group. When using internally managed groups, remember to run `terraform apply` each time group instances change.

```hcl
module "ilb" {
  source        = "./fabric/modules/net-ilb"
  project_id    = var.project_id
  region        = "europe-west1"
  name          = "ilb-test"
  service_label = "ilb-test"
  vpc_config = {
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
  }
  group_configs = {
    my-group = {
      zone = "europe-west1-b"
      instances = [
        "instance-1-self-link",
        "instance-2-self-link"
      ]
    }
  }
  backends = [{
    group          = module.ilb.groups.my-group.self_link
  }]
  health_check_config = {
    http = {
      port = 80
    }
  }
}
# tftest modules=1 resources=4
```

### End to end example

This example spins up a simple HTTP server and combines four modules:

- [`nginx`](../cloud-config-container/nginx) from the `cloud-config-container` collection, to manage instance configuration
- [`compute-vm`](../compute-vm) to manage the instance template and unmanaged instance group
- this module to create an Internal Load Balancer in front of the managed instance group

Note that the example uses the GCE default service account. You might want to create an ad-hoc service account by combining the [`iam-service-account`](../iam-service-account) module, or by having the GCE VM module create one for you. In both cases, remember to set at least logging write permissions for the service account, or the container on the instances won't be able to start.

```hcl
module "cos-nginx" {
  source = "./fabric/modules/cloud-config-container/nginx"
}

module "instance-group" {
  source     = "./fabric/modules/compute-vm"
  for_each = toset(["b", "c"])
  project_id = var.project_id
  zone     = "europe-west1-${each.key}"
  name       = "ilb-test-${each.key}"
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
  tags = ["http-server", "ssh"]
  metadata = {
    user-data = module.cos-nginx.cloud_config
  }
  group = { named_ports = {} }
}

module "ilb" {
  source        = "./fabric/modules/net-ilb"
  project_id    = var.project_id
  region        = "europe-west1"
  name          = "ilb-test"
  service_label = "ilb-test"
  vpc_config = {
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
    }
  ports         = [80]
  backends = [
    for z, mod in module.instance-group : {
      group          = mod.group.self_link
      balancing_mode = "UTILIZATION"
    }
  ]
  health_check_config = {
    http = {
      port = 80
    }
  }
}
# tftest modules=3 resources=7
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [name](variables.tf#L184) | Name used for all resources. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L195) | Project id where resources will be created. | <code>string</code> | ✓ |  |
| [region](variables.tf#L206) | GCP region. | <code>string</code> | ✓ |  |
| [vpc_config](variables.tf#L217) | VPC-level configuration. | <code title="object&#40;&#123;&#10;  network    &#61; string&#10;  subnetwork &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> | ✓ |  |
| [address](variables.tf#L17) | Optional IP address used for the forwarding rule. | <code>string</code> |  | <code>null</code> |
| [backend_service_config](variables.tf#L23) | Backend service level configuration. | <code title="object&#40;&#123;&#10;  connection_draining_timeout_sec &#61; optional&#40;number&#41;&#10;  connection_tracking &#61; optional&#40;object&#40;&#123;&#10;    idle_timeout_sec          &#61; optional&#40;number&#41;&#10;    persist_conn_on_unhealthy &#61; optional&#40;string&#41;&#10;    track_per_session         &#61; optional&#40;bool&#41;&#10;  &#125;&#41;&#41;&#10;  enable_subsetting &#61; optional&#40;bool&#41;&#10;  failover_config &#61; optional&#40;object&#40;&#123;&#10;    disable_conn_drain        &#61; optional&#40;bool&#41;&#10;    drop_traffic_if_unhealthy &#61; optional&#40;bool&#41;&#10;    ratio                     &#61; optional&#40;number&#41;&#10;  &#125;&#41;&#41;&#10;  log_sample_rate  &#61; optional&#40;number&#41;&#10;  session_affinity &#61; optional&#40;string&#41;&#10;  timeout_sec      &#61; optional&#40;number&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>&#123;&#125;</code> |
| [backends](variables.tf#L56) | Load balancer backends, balancing mode is one of 'CONNECTION' or 'UTILIZATION'. | <code title="list&#40;object&#40;&#123;&#10;  group          &#61; string&#10;  balancing_mode &#61; optional&#40;string, &#34;CONNECTION&#34;&#41;&#10;  description    &#61; optional&#40;string, &#34;Terraform managed.&#34;&#41;&#10;  failover       &#61; optional&#40;bool, false&#41;&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#91;&#93;</code> |
| [description](variables.tf#L75) | Optional description used for resources. | <code>string</code> |  | <code>&#34;Terraform managed.&#34;</code> |
| [global_access](variables.tf#L81) | Global access, defaults to false if not set. | <code>bool</code> |  | <code>null</code> |
| [group_configs](variables.tf#L87) | Optional unmanaged groups to create. Can be referenced in backends via outputs. | <code title="map&#40;object&#40;&#123;&#10;  zone        &#61; string&#10;  instances   &#61; optional&#40;list&#40;string&#41;, &#91;&#93;&#41;&#10;  named_ports &#61; optional&#40;map&#40;number&#41;, &#123;&#125;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [health_check](variables.tf#L98) | Name of existing health check to use, disables auto-created health check. | <code>string</code> |  | <code>null</code> |
| [health_check_config](variables.tf#L104) | Optional auto-created health check configuration, use the output self-link to set it in the auto healing policy. Refer to examples for usage. | <code title="object&#40;&#123;&#10;  check_interval_sec  &#61; optional&#40;number&#41;&#10;  description         &#61; optional&#40;string, &#34;Terraform managed.&#34;&#41;&#10;  enable_logging      &#61; optional&#40;bool, false&#41;&#10;  healthy_threshold   &#61; optional&#40;number&#41;&#10;  timeout_sec         &#61; optional&#40;number&#41;&#10;  unhealthy_threshold &#61; optional&#40;number&#41;&#10;  grpc &#61; optional&#40;object&#40;&#123;&#10;    port               &#61; optional&#40;number&#41;&#10;    port_name          &#61; optional&#40;string&#41;&#10;    port_specification &#61; optional&#40;string&#41; &#35; USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT&#10;    service_name       &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;  http &#61; optional&#40;object&#40;&#123;&#10;    host               &#61; optional&#40;string&#41;&#10;    port               &#61; optional&#40;number&#41;&#10;    port_name          &#61; optional&#40;string&#41;&#10;    port_specification &#61; optional&#40;string&#41; &#35; USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT&#10;    proxy_header       &#61; optional&#40;string&#41;&#10;    request_path       &#61; optional&#40;string&#41;&#10;    response           &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;  http2 &#61; optional&#40;object&#40;&#123;&#10;    host               &#61; optional&#40;string&#41;&#10;    port               &#61; optional&#40;number&#41;&#10;    port_name          &#61; optional&#40;string&#41;&#10;    port_specification &#61; optional&#40;string&#41; &#35; USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT&#10;    proxy_header       &#61; optional&#40;string&#41;&#10;    request_path       &#61; optional&#40;string&#41;&#10;    response           &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;  https &#61; optional&#40;object&#40;&#123;&#10;    host               &#61; optional&#40;string&#41;&#10;    port               &#61; optional&#40;number&#41;&#10;    port_name          &#61; optional&#40;string&#41;&#10;    port_specification &#61; optional&#40;string&#41; &#35; USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT&#10;    proxy_header       &#61; optional&#40;string&#41;&#10;    request_path       &#61; optional&#40;string&#41;&#10;    response           &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;  tcp &#61; optional&#40;object&#40;&#123;&#10;    port               &#61; optional&#40;number&#41;&#10;    port_name          &#61; optional&#40;string&#41;&#10;    port_specification &#61; optional&#40;string&#41; &#35; USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT&#10;    proxy_header       &#61; optional&#40;string&#41;&#10;    request            &#61; optional&#40;string&#41;&#10;    response           &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;  ssl &#61; optional&#40;object&#40;&#123;&#10;    port               &#61; optional&#40;number&#41;&#10;    port_name          &#61; optional&#40;string&#41;&#10;    port_specification &#61; optional&#40;string&#41; &#35; USE_FIXED_PORT USE_NAMED_PORT USE_SERVING_PORT&#10;    proxy_header       &#61; optional&#40;string&#41;&#10;    request            &#61; optional&#40;string&#41;&#10;    response           &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  tcp &#61; &#123;&#10;    port_specification &#61; &#34;USE_SERVING_PORT&#34;&#10;  &#125;&#10;&#125;">&#123;&#8230;&#125;</code> |
| [labels](variables.tf#L178) | Labels set on resources. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [ports](variables.tf#L189) | Comma-separated ports, leave null to use all ports. | <code>list&#40;string&#41;</code> |  | <code>null</code> |
| [protocol](variables.tf#L200) | IP protocol used, defaults to TCP. | <code>string</code> |  | <code>&#34;TCP&#34;</code> |
| [service_label](variables.tf#L211) | Optional prefix of the fully qualified forwarding rule name. | <code>string</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [backend_service](outputs.tf#L17) | Backend resource. |  |
| [backend_service_id](outputs.tf#L22) | Backend id. |  |
| [backend_service_self_link](outputs.tf#L27) | Backend self link. |  |
| [forwarding_rule](outputs.tf#L32) | Forwarding rule resource. |  |
| [forwarding_rule_address](outputs.tf#L37) | Forwarding rule address. |  |
| [forwarding_rule_id](outputs.tf#L42) | Forwarding rule id. |  |
| [forwarding_rule_self_link](outputs.tf#L47) | Forwarding rule self link. |  |
| [group_self_links](outputs.tf#L57) | Optional unmanaged instance group self links. |  |
| [groups](outputs.tf#L52) | Optional unmanaged instance group resources. |  |
| [health_check](outputs.tf#L64) | Auto-created health-check resource. |  |
| [health_check_self_id](outputs.tf#L69) | Auto-created health-check self id. |  |
| [health_check_self_link](outputs.tf#L74) | Auto-created health-check self link. |  |

<!-- END TFDOC -->
