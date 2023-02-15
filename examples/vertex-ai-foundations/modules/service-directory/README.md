# Google Cloud Service Directory Module

This module allows managing a single [Service Directory](https://cloud.google.com/service-directory) namespace, including multiple services, endpoints and IAM bindings at the namespace and service levels.

It can be used in conjunction with the [DNS](../dns) module to create [service-directory based DNS zones](https://cloud.google.com/service-directory/docs/configuring-service-directory-zone, offloading IAM control of `A` and `SRV` records at the namespace or service level to Service Directory. The last examples shows how to wire the two modules together.


## Examples

### Namespace with IAM

```hcl
module "service-directory" {
  source      = "./fabric/modules/service-directory"
  project_id  = "my-project"
  location    = "europe-west1"
  name        = "sd-1"
  iam = {
    "roles/servicedirectory.editor" = [
      "serviceAccount:namespace-editor@example.com"
    ]
  }
}
# tftest modules=1 resources=2
```

### Services with IAM and endpoints

```hcl
module "service-directory" {
  source      = "./fabric/modules/service-directory"
  project_id  = "my-project"
  location    = "europe-west1"
  name        = "sd-1"
  services = {
    one = {
      endpoints = ["first", "second"]
      metadata  = null
    }
  }
  service_iam = {
    one = {
      "roles/servicedirectory.editor" = [
        "serviceAccount:service-editor.example.com"
      ]
    }
  }
  endpoint_config = {
    "one/first"  = { address = "127.0.0.1", port = 80, metadata = {} }
    "one/second" = { address = "127.0.0.2", port = 80, metadata = {} }
  }
}
# tftest modules=1 resources=5
```

### DNS based zone

Wiring a service directory namespace to a private DNS zone allows querying the namespace, and delegating control of DNS records at the namespace or service level. This effectively allows fine grained ACL control of Cloud DNS zones.

```hcl
module "service-directory" {
  source      = "./fabric/modules/service-directory"
  project_id  = "my-project"
  location    = "europe-west1"
  name       = "apps"
  iam = {
    "roles/servicedirectory.editor" = [
      "serviceAccount:namespace-editor@example.com"
    ]
  }
  services = {
    app1 = { endpoints = ["one"], metadata = null }
  }
  endpoint_config = {
    "app1/one" = { address = "127.0.0.1", port = 80, metadata = {} }
  }
}

module "dns-sd" {
  source                      = "./fabric/modules/dns"
  project_id                  = "my-project"
  type                        = "service-directory"
  name                        = "apps"
  domain                      = "apps.example.org."
  client_networks             = [var.vpc.self_link]
  service_directory_namespace = module.service-directory.id
}
# tftest modules=2 resources=5
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [location](variables.tf#L40) | Namespace location. | <code>string</code> | ✓ |  |
| [name](variables.tf#L45) | Namespace name. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L50) | Project used for resources. | <code>string</code> | ✓ |  |
| [endpoint_config](variables.tf#L18) | Map of endpoint attributes, keys are in service/endpoint format. | <code title="map&#40;object&#40;&#123;&#10;  address  &#61; string&#10;  port     &#61; number&#10;  metadata &#61; map&#40;string&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam](variables.tf#L28) | IAM bindings for namespace, in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [labels](variables.tf#L34) | Labels. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [service_iam](variables.tf#L55) | IAM bindings for services, in {SERVICE => {ROLE => [MEMBERS]}} format. | <code>map&#40;map&#40;list&#40;string&#41;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [services](variables.tf#L61) | Service configuration, using service names as keys. | <code title="map&#40;object&#40;&#123;&#10;  endpoints &#61; list&#40;string&#41;&#10;  metadata  &#61; map&#40;string&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [endpoints](outputs.tf#L17) | Endpoint resources. |  |
| [id](outputs.tf#L22) | Namespace id (short name). |  |
| [name](outputs.tf#L27) | Namespace name (long name). |  |
| [namespace](outputs.tf#L32) | Namespace resource. |  |
| [service_id](outputs.tf#L40) | Service ids (short names). |  |
| [service_names](outputs.tf#L50) | Service ids (long names). |  |
| [services](outputs.tf#L60) | Service resources. |  |

<!-- END TFDOC -->
