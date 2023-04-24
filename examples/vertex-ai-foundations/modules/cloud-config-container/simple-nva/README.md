# Google Simple NVA Module

This module allows for the creation of a NVA (Network Virtual Appliance) to be used for experiments and as a stub for future appliances deployment.

This NVA can be used to interconnect up to 8 VPCs.

## Examples

### Simple example

```hcl
# Interfaces configuration
locals {
  network_interfaces = [
    {
      addresses  = null
      name       = "dev"
      nat        = false
      network    = "dev_vpc_self_link"
      routes     = ["10.128.0.0/9"]
      subnetwork = "dev_vpc_nva_subnet_self_link"
    },
    {
      addresses  = null
      name       = "prod"
      nat        = false
      network    = "prod_vpc_self_link"
      routes     = ["10.0.0.0/9"]
      subnetwork = "prod_vpc_nva_subnet_self_link"
    }
}

# NVA config
module "nva-cloud-config" {
  source               = "../../../cloud-foundation-fabric/modules/cloud-config-container/simple-nva"
  enable_health_checks = true
  network_interfaces   = local.network_interfaces
  files = {
    "/var/lib/cloud/scripts/per-boot/firewall-rules.sh" = {
      content     = file("./your_path/to/firewall-rules.sh")
      owner       = "root"
      permissions = 0700
    }
  }
}

# COS VM
module "nva" {
  source             = "../../modules/compute-vm"
  project_id         = "myproject"
  instance_type      = "e2-standard-2"
  name               = "nva"
  can_ip_forward     = true
  zone               = "europe-west8-a"
  tags               = ["nva"]
  network_interfaces = local.network_interfaces
  boot_disk = {
    image = "projects/cos-cloud/global/images/family/cos-stable"
    size  = 10
    type  = "pd-balanced"
  }
  metadata = {
    user-data = module.nva-cloud-config.cloud_config
  }
}
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [network_interfaces](variables.tf#L39) | Network interfaces configuration. | <code title="list&#40;object&#40;&#123;&#10;  routes &#61; optional&#40;list&#40;string&#41;&#41;&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> | ✓ |  |
| [cloud_config](variables.tf#L17) | Cloud config template path. If null default will be used. | <code>string</code> |  | <code>null</code> |
| [enable_health_checks](variables.tf#L33) | Configures routing to enable responses to health check probes. | <code>bool</code> |  | <code>false</code> |
| [files](variables.tf#L23) | Map of extra files to create on the instance, path as key. Owner and permissions will use defaults if null. | <code title="map&#40;object&#40;&#123;&#10;  content     &#61; string&#10;  owner       &#61; string&#10;  permissions &#61; string&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [test_instance](variables-instance.tf#L17) | Test/development instance attributes, leave null to skip creation. | <code title="object&#40;&#123;&#10;  project_id &#61; string&#10;  zone       &#61; string&#10;  name       &#61; string&#10;  type       &#61; string&#10;  network    &#61; string&#10;  subnetwork &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [test_instance_defaults](variables-instance.tf#L30) | Test/development instance defaults used for optional configuration. If image is null, COS stable will be used. | <code title="object&#40;&#123;&#10;  disks &#61; map&#40;object&#40;&#123;&#10;    read_only &#61; bool&#10;    size      &#61; number&#10;  &#125;&#41;&#41;&#10;  image                 &#61; string&#10;  metadata              &#61; map&#40;string&#41;&#10;  nat                   &#61; bool&#10;  service_account_roles &#61; list&#40;string&#41;&#10;  tags                  &#61; list&#40;string&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  disks    &#61; &#123;&#125;&#10;  image    &#61; null&#10;  metadata &#61; &#123;&#125;&#10;  nat      &#61; false&#10;  service_account_roles &#61; &#91;&#10;    &#34;roles&#47;logging.logWriter&#34;,&#10;    &#34;roles&#47;monitoring.metricWriter&#34;&#10;  &#93;&#10;  tags &#61; &#91;&#34;ssh&#34;&#93;&#10;&#125;">&#123;&#8230;&#125;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [cloud_config](outputs.tf#L17) | Rendered cloud-config file to be passed as user-data instance metadata. |  |
| [test_instance](outputs-instance.tf#L17) | Optional test instance name and address. |  |

<!-- END TFDOC -->
