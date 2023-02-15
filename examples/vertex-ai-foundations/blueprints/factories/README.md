# The why and the how of Resource Factories

Terraform modules can be designed - where it makes sense - to implement a resource factory, which is a configuration-driven approach to resource creation meant to:

- accelerate and rationalize the repetitive creation of common resources, such as firewall rules and subnets
- enable teams without Terraform specific knowledge to leverage IaC via human-friendly and machine-parseable YAML files
- make it simple to implement specific requirements and best practices (e.g. "always enable PGA for GCP subnets", or "only allow using regions `europe-west1` and `europe-west3`")
- codify and centralise business logics and policies (e.g. labels and naming conventions)
- allow to easily parse and understand sets of specific resources, for documentation purposes

Generally speaking, the configurations for a resource factory consists in one or more YaML files, optionally grouped in folders, that describe resources following a well defined, validable schema, such as in the example below for the subnet factory of the [`net-vpc`](../../modules/net-vpc) module, which allows for the massive creation of subnets for a given VPC.

```yaml
region: europe-west3
ip_cidr_range: 10.0.0.0/24
description: Sample Subnet in project project-prod-a, vpc-alpha
secondary_ip_ranges:
  secondary-range-a: 192.168.0.0/24
  secondary-range-b: 192.168.1.0/24
```

Terraform natively supports YaML, JSON and CSV parsing - however Fabric has decided to embrace YaML for the following reasons:

- YaML is easier to parse for a human, and allows for comments and nested, complex structures
- JSON and CSV can't include comments, which can be used to document configurations, but are often useful to bridge from other systems in automated pipelines
- JSON is more verbose (reads: longer) and harder to parse visually for humans
- CSV isn't often expressive enough (e.g. dit doesn't allow for nested structures)

If needed, converting factories to consume JSON is a matter of switching from `yamldecode()` to `jsondecode()` in the right place on each module.

## Resource factories in Fabric

### Fabric Modules

- [folder](../../modules/folder/README.md#firewall-policy-factory) and [organization](../../modules/organization/README.md#firewall-policy-factory) implement factories for [hierarchical firewall policies](https://cloud.google.com/vpc/docs/firewall-policies)
- [net-vpc](../../modules/net-vpc/README.md#subnet-factory) for subnets creation
- [net-vpc-firewall](../../modules/net-vpc-firewall/README.md#rules-factory) for massive rules creation

### Dedicated Factories

- [cloud-identity-group-factory](cloud-identity-group-factory/README.md) for Cloud Identity group
- [net-vpc-firewall-yaml](net-vpc-firewall-yaml/README.md) for VPC firewall rules across different projects/VPCs
- [project-factory](project-factory/README.md) for projects
 
