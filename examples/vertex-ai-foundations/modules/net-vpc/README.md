# Minimalistic VPC module

This module allows creation and management of VPC networks including subnetworks and subnetwork IAM bindings, Shared VPC activation and service project registration, and one-to-one peering.

## Examples

The module allows for several different VPC configurations, some of the most common are shown below.

### Simple VPC

```hcl
module "vpc" {
  source     = "./fabric/modules/net-vpc"
  project_id = "my-project"
  name       = "my-network"
  subnets = [
    {
      ip_cidr_range = "10.0.0.0/24"
      name          = "production"
      region        = "europe-west1"
      secondary_ip_ranges = {
        pods     = "172.16.0.0/20"
        services = "192.168.0.0/24"
      }
    },
    {
      ip_cidr_range = "10.0.16.0/24"
      name          = "production"
      region        = "europe-west2"
    }
  ]
}
# tftest modules=1 resources=3
```

### Peering

A single peering can be configured for the VPC, so as to allow management of simple scenarios, and more complex configurations like hub and spoke by defining the peering configuration on the spoke VPCs. Care must be taken so as a single peering is created/changed/destroyed at a time, due to the specific behaviour of the peering API calls.

If you only want to create the "local" side of the peering, use `peering_create_remote_end` to `false`. This is useful if you don't have permissions on the remote project/VPC to create peerings.

```hcl
module "vpc-hub" {
  source     = "./fabric/modules/net-vpc"
  project_id = "hub"
  name       = "vpc-hub"
  subnets = [{
    ip_cidr_range      = "10.0.0.0/24"
    name               = "subnet-1"
    region             = "europe-west1"
  }]
}

module "vpc-spoke-1" {
  source     = "./fabric/modules/net-vpc"
  project_id = "spoke1"
  name       = "vpc-spoke1"
  subnets = [{
    ip_cidr_range      = "10.0.1.0/24"
    name               = "subnet-2"
    region             = "europe-west1"
  }]
  peering_config = {
    peer_vpc_self_link = module.vpc-hub.self_link
    import_routes      = true
  }
}
# tftest modules=2 resources=6
```

### Shared VPC

[Shared VPC](https://cloud.google.com/vpc/docs/shared-vpc) is a project-level functionality which enables a project to share its VPCs with other projects. The `shared_vpc_host` variable is here to help with rapid prototyping, we recommend leveraging the project module for production usage.

```hcl
locals {
  service_project_1 = {
    project_id = "project1"
    gke_service_account = "gke"
    cloud_services_service_account = "cloudsvc"
  }
  service_project_2 = {
    project_id = "project2"
  }
}

module "vpc-host" {
  source     = "./fabric/modules/net-vpc"
  project_id = "my-project"
  name       = "my-host-network"
  subnets = [
    {
      ip_cidr_range = "10.0.0.0/24"
      name          = "subnet-1"
      region        = "europe-west1"
      secondary_ip_range = {
        pods     = "172.16.0.0/20"
        services = "192.168.0.0/24"
      }
    }
  ]
  shared_vpc_host = true
  shared_vpc_service_projects = [
    local.service_project_1.project_id,
    local.service_project_2.project_id
  ]
  subnet_iam = {
    "europe-west1/subnet-1" = {
      "roles/compute.networkUser" = [
        local.service_project_1.cloud_services_service_account,
        local.service_project_1.gke_service_account
      ]
      "roles/compute.securityAdmin" = [
        local.service_project_1.gke_service_account
      ]
    }
  }
}
# tftest modules=1 resources=7
```

### Private Service Networking

```hcl
module "vpc" {
  source     = "./fabric/modules/net-vpc"
  project_id = "my-project"
  name       = "my-network"
  subnets = [
    {
      ip_cidr_range      = "10.0.0.0/24"
      name               = "production"
      region             = "europe-west1"
    }
  ]
  psa_config = {
    ranges = { myrange = "10.0.1.0/24" }
  }
}
# tftest modules=1 resources=5
```

### Private Service Networking with peering routes

Custom routes can be optionally exported/imported through the peering formed with the Google managed PSA VPC.

```hcl
module "vpc" {
  source     = "./fabric/modules/net-vpc"
  project_id = "my-project"
  name       = "my-network"
  subnets = [
    {
      ip_cidr_range      = "10.0.0.0/24"
      name               = "production"
      region             = "europe-west1"
    }
  ]
  psa_config = {
    ranges = { myrange = "10.0.1.0/24" }
    export_routes = true
    import_routes = true
  }
}
# tftest modules=1 resources=5
```

### Subnets for Private Service Connect, Proxy-only subnets

Along with common private subnets module supports creation more service specific subnets for the following purposes:

- [Proxy-only subnets](https://cloud.google.com/load-balancing/docs/proxy-only-subnets) for Regional HTTPS Internal HTTPS Load Balancers
- [Private Service Connect](https://cloud.google.com/vpc/docs/private-service-connect#psc-subnets) subnets

```hcl
module "vpc" {
  source     = "./fabric/modules/net-vpc"
  project_id = "my-project"
  name       = "my-network"

  subnets_proxy_only = [
    {
      ip_cidr_range = "10.0.1.0/24"
      name          = "regional-proxy"
      region        = "europe-west1"
      active        = true
    }
  ]
  subnets_psc = [
    {
      ip_cidr_range = "10.0.3.0/24"
      name          = "psc"
      region        = "europe-west1"
    }
  ]
}
# tftest modules=1 resources=3
```

### DNS Policies

```hcl
module "vpc" {
  source     = "./fabric/modules/net-vpc"
  project_id = "my-project"
  name       = "my-network"
  dns_policy = {
    inbound  = true
    outbound = {
      private_ns = ["10.0.0.1"]
      public_ns  = ["8.8.8.8"]
    }
  }
  subnets = [
    {
      ip_cidr_range      = "10.0.0.0/24"
      name               = "production"
      region             = "europe-west1"
    }
  ]
}
# tftest modules=1 resources=3
```

### Subnet Factory

The `net-vpc` module includes a subnet factory (see [Resource Factories](../../blueprints/factories/)) for the massive creation of subnets leveraging one configuration file per subnet.

```hcl
module "vpc" {
  source      = "./fabric/modules/net-vpc"
  project_id  = "my-project"
  name        = "my-network"
  data_folder = "config/subnets"
}
# tftest skip
```

```yaml
# ./config/subnets/subnet-name.yaml
region: europe-west1
description: Sample description
ip_cidr_range: 10.0.0.0/24
# optional attributes
enable_private_access: false   # defaults to true
iam_users: ["foobar@example.com"] # grant compute/networkUser to users
iam_groups: ["lorem@example.com"] # grant compute/networkUser to groups
iam_service_accounts: ["fbz@prj.iam.gserviceaccount.com"]
secondary_ip_ranges:              # map of secondary ip ranges
  secondary-range-a: 192.168.0.0/24
flow_logs:                        # enable, set to empty map to use defaults
  - aggregation_interval: "INTERVAL_5_SEC"
  - flow_sampling: 0.5
  - metadata: "INCLUDE_ALL_METADATA"
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [name](variables.tf#L60) | The name of the network being created. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L76) | The ID of the project where this VPC will be created. | <code>string</code> | ✓ |  |
| [auto_create_subnetworks](variables.tf#L17) | Set to true to create an auto mode subnet, defaults to custom mode. | <code>bool</code> |  | <code>false</code> |
| [data_folder](variables.tf#L23) | An optional folder containing the subnet configurations in YaML format. | <code>string</code> |  | <code>null</code> |
| [delete_default_routes_on_create](variables.tf#L29) | Set to true to delete the default routes at creation time. | <code>bool</code> |  | <code>false</code> |
| [description](variables.tf#L35) | An optional description of this resource (triggers recreation on change). | <code>string</code> |  | <code>&#34;Terraform-managed.&#34;</code> |
| [dns_policy](variables.tf#L41) | DNS policy setup for the VPC. | <code title="object&#40;&#123;&#10;  inbound &#61; optional&#40;bool&#41;&#10;  logging &#61; optional&#40;bool&#41;&#10;  outbound &#61; optional&#40;object&#40;&#123;&#10;    private_ns &#61; list&#40;string&#41;&#10;    public_ns  &#61; list&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [mtu](variables.tf#L54) | Maximum Transmission Unit in bytes. The minimum value for this field is 1460 (the default) and the maximum value is 1500 bytes. | <code>number</code> |  | <code>null</code> |
| [peering_config](variables.tf#L65) | VPC peering configuration. | <code title="object&#40;&#123;&#10;  peer_vpc_self_link &#61; string&#10;  create_remote_peer &#61; optional&#40;bool, true&#41;&#10;  export_routes      &#61; optional&#40;bool&#41;&#10;  import_routes      &#61; optional&#40;bool&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [psa_config](variables.tf#L81) | The Private Service Access configuration for Service Networking. | <code title="object&#40;&#123;&#10;  ranges        &#61; map&#40;string&#41;&#10;  export_routes &#61; optional&#40;bool, false&#41;&#10;  import_routes &#61; optional&#40;bool, false&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [routes](variables.tf#L91) | Network routes, keyed by name. | <code title="map&#40;object&#40;&#123;&#10;  dest_range    &#61; string&#10;  next_hop_type &#61; string &#35; gateway, instance, ip, vpn_tunnel, ilb&#10;  next_hop      &#61; string&#10;  priority      &#61; optional&#40;number&#41;&#10;  tags          &#61; optional&#40;list&#40;string&#41;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [routing_mode](variables.tf#L111) | The network routing mode (default 'GLOBAL'). | <code>string</code> |  | <code>&#34;GLOBAL&#34;</code> |
| [shared_vpc_host](variables.tf#L121) | Enable shared VPC for this project. | <code>bool</code> |  | <code>false</code> |
| [shared_vpc_service_projects](variables.tf#L127) | Shared VPC service projects to register with this host. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [subnet_iam](variables.tf#L133) | Subnet IAM bindings in {REGION/NAME => {ROLE => [MEMBERS]} format. | <code>map&#40;map&#40;list&#40;string&#41;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [subnets](variables.tf#L139) | Subnet configuration. | <code title="list&#40;object&#40;&#123;&#10;  name                  &#61; string&#10;  ip_cidr_range         &#61; string&#10;  region                &#61; string&#10;  description           &#61; optional&#40;string&#41;&#10;  enable_private_access &#61; optional&#40;bool, true&#41;&#10;  flow_logs_config &#61; optional&#40;object&#40;&#123;&#10;    aggregation_interval &#61; optional&#40;string&#41;&#10;    filter_expression    &#61; optional&#40;string&#41;&#10;    flow_sampling        &#61; optional&#40;number&#41;&#10;    metadata             &#61; optional&#40;string&#41;&#10;    metadata_fields &#61; optional&#40;list&#40;string&#41;&#41;&#10;  &#125;&#41;&#41;&#10;  ipv6 &#61; optional&#40;object&#40;&#123;&#10;    access_type           &#61; optional&#40;string&#41;&#10;    enable_private_access &#61; optional&#40;bool, true&#41;&#10;  &#125;&#41;&#41;&#10;  secondary_ip_ranges &#61; optional&#40;map&#40;string&#41;&#41;&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#91;&#93;</code> |
| [subnets_proxy_only](variables.tf#L164) | List of proxy-only subnets for Regional HTTPS  or Internal HTTPS load balancers. Note: Only one proxy-only subnet for each VPC network in each region can be active. | <code title="list&#40;object&#40;&#123;&#10;  name          &#61; string&#10;  ip_cidr_range &#61; string&#10;  region        &#61; string&#10;  description   &#61; optional&#40;string&#41;&#10;  active        &#61; bool&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#91;&#93;</code> |
| [subnets_psc](variables.tf#L176) | List of subnets for Private Service Connect service producers. | <code title="list&#40;object&#40;&#123;&#10;  name          &#61; string&#10;  ip_cidr_range &#61; string&#10;  region        &#61; string&#10;  description   &#61; optional&#40;string&#41;&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#91;&#93;</code> |
| [vpc_create](variables.tf#L187) | Create VPC. When set to false, uses a data source to reference existing VPC. | <code>bool</code> |  | <code>true</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [bindings](outputs.tf#L17) | Subnet IAM bindings. |  |
| [name](outputs.tf#L22) | The name of the VPC being created. |  |
| [network](outputs.tf#L34) | Network resource. |  |
| [project_id](outputs.tf#L46) | Project ID containing the network. Use this when you need to create resources *after* the VPC is fully set up (e.g. subnets created, shared VPC service projects attached, Private Service Networking configured). |  |
| [self_link](outputs.tf#L59) | The URI of the VPC being created. |  |
| [subnet_ips](outputs.tf#L71) | Map of subnet address ranges keyed by name. |  |
| [subnet_regions](outputs.tf#L78) | Map of subnet regions keyed by name. |  |
| [subnet_secondary_ranges](outputs.tf#L85) | Map of subnet secondary ranges keyed by name. |  |
| [subnet_self_links](outputs.tf#L96) | Map of subnet self links keyed by name. |  |
| [subnets](outputs.tf#L102) | Subnet resources. |  |
| [subnets_proxy_only](outputs.tf#L107) | L7 ILB or L7 Regional LB subnet resources. |  |
| [subnets_psc](outputs.tf#L112) | Private Service Connect subnet resources. |  |

<!-- END TFDOC -->
The key format is `subnet_region/subnet_name`. For example `europe-west1/my_subnet`.
