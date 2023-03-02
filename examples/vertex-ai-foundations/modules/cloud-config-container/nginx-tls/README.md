# Containerized Nginx with self-signed TLS on Container Optimized OS

This module manages a `cloud-config` configuration that starts a containerized Nginx with a self-signed TLS cert on Container Optimized OS.
This can be useful if you need quickly a VM or instance group answering HTTPS for prototyping.

The generated cloud config is rendered in the `cloud_config` output, and is meant to be used in instances or instance templates via the `user-data` metadata.

This module depends on the [`cos-generic-metadata` module](../cos-generic-metadata) being in the parent folder. If you change its location be sure to adjust the `source` attribute in `main.tf`.

## Examples

### Default configuration

```hcl
# Nginx with self-signed TLS config
module "cos-nginx-tls" {
  source = "./fabric/modules/cloud-config-container/nginx-tls"
}

# COS VM
module "vm-nginx-tls" {
  source     = "./fabric/modules/compute-vm"
  project_id = local.project_id
  zone       = local.zone
  name       = "cos-nginx-tls"
  network_interfaces = [{
    network    = local.vpc.self_link,
    subnetwork = local.vpc.subnet_self_link,
    nat        = false,
    addresses  = null
  }]

  metadata = {
    user-data = module.cos-nginx-tls.cloud_config
  }

  boot_disk = {
    image = "projects/cos-cloud/global/images/family/cos-stable"
    type  = "pd-ssd"
    size  = 10
  }

  service_account_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
}
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [docker_logging](variables.tf#L23) | Log via the Docker gcplogs driver. Disable if you use the legacy Logging Agent instead. | <code>bool</code> |  | <code>true</code> |
| [files](variables.tf#L41) | Map of extra files to create on the instance, path as key. Owner and permissions will use defaults if null. | <code title="map&#40;object&#40;&#123;&#10;  content     &#61; string&#10;  owner       &#61; string&#10;  permissions &#61; string&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>null</code> |
| [nginx_image](variables.tf#L17) | Nginx container image to use. | <code>string</code> |  | <code>&#34;nginx:1.23.1&#34;</code> |
| [runcmd_post](variables.tf#L35) | Extra commands to run after starting nginx. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [runcmd_pre](variables.tf#L29) | Extra commands to run before starting nginx. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [users](variables.tf#L51) | Additional list of usernames to be created. | <code title="list&#40;object&#40;&#123;&#10;  username &#61; string,&#10;  uid      &#61; number,&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code title="&#91;&#10;&#93;">&#91;&#8230;&#93;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [cloud_config](outputs.tf#L17) | Rendered cloud-config file to be passed as user-data instance metadata. |  |

<!-- END TFDOC -->
