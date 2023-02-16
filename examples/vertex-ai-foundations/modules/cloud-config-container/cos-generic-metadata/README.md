# Generic cloud-init generator for Container Optimized OS

This helper module manages a `cloud-config` configuration that can start a container on [Container Optimized OS](https://cloud.google.com/container-optimized-os/docs) (COS). Either a complete `cloud-config` template can be provided via the `cloud_config` variable with optional template variables via the `config_variables`, or a generic `cloud-config` can be generated based on typical parameters needed to start a container.

Logging can be enabled via the [Google Cloud Logging docker driver](https://docs.docker.com/config/containers/logging/gcplogs/) using the `gcp_logging` variable. This is enabled by default, but requires that the service account running the COS instance have the `roles/logging.logWriter` IAM role or equivalent permissions on the project. If it doesn't, the container will fail to start unless this is disabled.

The module renders the generated cloud config in the `cloud_config` output, which can be directly used in instances or instance templates via the `user-data` metadata attribute.

## Examples

### Default configuration

This example will create a `cloud-config` that starts [Envoy Proxy](https://www.envoyproxy.io) and expose it on port 80. For a complete example, look at the sibling [`envoy-traffic-director`](../envoy-traffic-director/README.md) module that uses this module to start Envoy Proxy and connect it to [Traffic Director](https://cloud.google.com/traffic-director).

```hcl
module "cos-envoy" {
  source = "./fabric/modules/cos-generic-metadata"

  container_image = "envoyproxy/envoy:v1.14.1"
  container_name  = "envoy"
  container_args  = "-c /etc/envoy/envoy.yaml --log-level info --allow-unknown-static-fields"

  container_volumes = [
    { host = "/etc/envoy/envoy.yaml", container = "/etc/envoy/envoy.yaml" }
  ]

  docker_args = "--network host --pid host"

  files = {
    "/var/run/envoy/customize.sh" = {
      content     = file("customize.sh")
      owner       = "root"
      permissions = "0744"
    }
    "/etc/envoy/envoy.yaml" = {
      content     = file("envoy.yaml")
      owner       = "root"
      permissions = "0644"
    }
  }

  run_commands = [
    "iptables -t nat -N ENVOY_IN_REDIRECT",
    "iptables -t nat -A ENVOY_IN_REDIRECT -p tcp -j REDIRECT --to-port 15001",
    "iptables -t nat -A PREROUTING -p tcp -m tcp --dport 80 -j ENVOY_IN_REDIRECT",
    "iptables -t filter -A INPUT -p tcp -m tcp --dport 15001 -m state --state NEW,ESTABLISHED -j ACCEPT",
    "/var/run/envoy/customize.sh",
    "systemctl daemon-reload",
    "systemctl start envoy",
  ]

  users = [
    {
      username = "envoy",
      uid      = 1337
    }
  ]
}
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [container_image](variables.tf#L42) | Container image. | <code>string</code> | ✓ |  |
| [authenticate_gcr](variables.tf#L124) | Setup docker to pull images from private GCR. Requires at least one user since the token is stored in the home of the first user defined. | <code>bool</code> |  | <code>false</code> |
| [boot_commands](variables.tf#L17) | List of cloud-init `bootcmd`s. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [cloud_config](variables.tf#L23) | Cloud config template path. If provided, takes precedence over all other arguments. | <code>string</code> |  | <code>null</code> |
| [config_variables](variables.tf#L29) | Additional variables used to render the template passed via `cloud_config`. | <code>map&#40;any&#41;</code> |  | <code>&#123;&#125;</code> |
| [container_args](variables.tf#L35) | Arguments for container. | <code>string</code> |  | <code>&#34;&#34;</code> |
| [container_name](variables.tf#L47) | Name of the container to be run. | <code>string</code> |  | <code>&#34;container&#34;</code> |
| [container_volumes](variables.tf#L53) | List of volumes. | <code title="list&#40;object&#40;&#123;&#10;  host      &#61; string,&#10;  container &#61; string&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#91;&#93;</code> |
| [docker_args](variables.tf#L62) | Extra arguments to be passed for docker. | <code>string</code> |  | <code>null</code> |
| [docker_logging](variables.tf#L68) | Log via the Docker gcplogs driver. Disable if you use the legacy Logging Agent instead. | <code>bool</code> |  | <code>true</code> |
| [file_defaults](variables.tf#L74) | Default owner and permissions for files. | <code title="object&#40;&#123;&#10;  owner       &#61; string&#10;  permissions &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  owner       &#61; &#34;root&#34;&#10;  permissions &#61; &#34;0644&#34;&#10;&#125;">&#123;&#8230;&#125;</code> |
| [files](variables.tf#L86) | Map of extra files to create on the instance, path as key. Owner and permissions will use defaults if null. | <code title="map&#40;object&#40;&#123;&#10;  content     &#61; string&#10;  owner       &#61; string&#10;  permissions &#61; string&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [gcp_logging](variables.tf#L96) | Should container logs be sent to Google Cloud Logging. | <code>bool</code> |  | <code>true</code> |
| [run_as_first_user](variables.tf#L118) | Run as the first user if users are specified. | <code>bool</code> |  | <code>true</code> |
| [run_commands](variables.tf#L102) | List of cloud-init `runcmd`s. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [users](variables.tf#L108) | List of usernames to be created. If provided, first user will be used to run the container. | <code title="list&#40;object&#40;&#123;&#10;  username &#61; string,&#10;  uid      &#61; number,&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code title="&#91;&#10;&#93;">&#91;&#8230;&#93;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [cloud_config](outputs.tf#L17) | Rendered cloud-config file to be passed as user-data instance metadata. |  |

<!-- END TFDOC -->
