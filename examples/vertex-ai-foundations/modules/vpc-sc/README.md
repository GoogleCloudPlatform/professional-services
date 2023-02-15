# VPC Service Controls

This module offers a unified interface to manage VPC Service Controls [Access Policy](https://cloud.google.com/access-context-manager/docs/create-access-policy), [Access Levels](https://cloud.google.com/access-context-manager/docs/manage-access-levels), and [Service Perimeters](https://cloud.google.com/vpc-service-controls/docs/service-perimeters).

Given the complexity of the underlying resources, the module intentionally mimics their interfaces to make it easier to map their documentation onto its variables, and reduce the internal complexity. The tradeoff is some verbosity, and a very complex type for the `service_perimeters_regular` variable (while [optional type attributes](https://www.terraform.io/language/expressions/type-constraints#experimental-optional-object-type-attributes) are still an experiment).

If you are using [Application Default Credentials](https://cloud.google.com/sdk/gcloud/reference/auth/application-default) with Terraform and run into permissions issues, make sure to check out the recommended provider configuration in the [VPC SC resources documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/access_context_manager_access_level).

## Examples

### Access policy

By default, the module is configured to use an existing policy, passed in by name in the `access_policy` variable:

```hcl
module "test" {
  source        = "./fabric/modules/vpc-sc"
  access_policy = "12345678"
}
# tftest modules=0 resources=0
```

If you need the module to create the policy for you, use the `access_policy_create` variable, and set `access_policy` to `null`:

```hcl
module "test" {
  source        = "./fabric/modules/vpc-sc"
  access_policy = null
  access_policy_create = {
    parent = "organizations/123456"
    title  = "vpcsc-policy"
  }
}
# tftest modules=1 resources=1
```

### Access levels

As highlighted above, the `access_levels` type replicates the underlying resource structure.

```hcl
module "test" {
  source        = "./fabric/modules/vpc-sc"
  access_policy = "12345678"
  access_levels = {
    a1 = {
      combining_function = null
      conditions = [{
        members = ["user:user1@example.com"], ip_subnetworks = null,
        negate = null, regions = null,  required_access_levels = null
      }]
    }
    a2 = {
      combining_function = "OR"
      conditions = [{
        regions       = ["IT", "FR"], ip_subnetworks = null,
        members = null, negate = null, required_access_levels = null
      },{
        ip_subnetworks = ["101.101.101.0/24"], members = null,
        negate = null, regions = null, required_access_levels = null
      }]
    }
  }
}
# tftest modules=1 resources=2
```

### Service perimeters

Bridge and regular service perimeters use two separate variables, as bridge perimeters only accept a limited number of arguments, and can leverage a much simpler interface.

The regular perimeters variable exposes all the complexity of the underlying resource, use [its documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/access_context_manager_service_perimeter) as a reference about the possible values and configurations.

If you need to refer to access levels created by the same module in regular service perimeters, you can either use the module's outputs in the provided variables, or the key used to identify the relevant access level. The example below shows how to do this in practice.

/*
Resources for both perimeters have a `lifecycle` block that ignores changes to `spec` and `status` resources (projects), to allow using the additive resource `google_access_context_manager_service_perimeter_resource` at project creation. If this is not needed, the `lifecycle` blocks can be safely commented in the code.
*/

#### Bridge type

```hcl
module "test" {
  source        = "./fabric/modules/vpc-sc"
  access_policy = "12345678"
  service_perimeters_bridge = {
    b1 = {
      status_resources          = ["projects/111110", "projects/111111"]
      spec_resources            = null
      use_explicit_dry_run_spec = false
    }
    b2 = {
      status_resources          = null
      spec_resources            = ["projects/222220", "projects/222221"]
      use_explicit_dry_run_spec = true
    }
  }
}
# tftest modules=1 resources=2
```

#### Regular type

```hcl
module "test" {
  source        = "./fabric/modules/vpc-sc"
  access_policy = "12345678"
  access_levels = {
    a1 = {
      combining_function = null
      conditions = [{
        members       = ["user:user1@example.com"], ip_subnetworks = null,
        negate = null, regions = null, required_access_levels = null
      }]
    }
    a2 = {
      combining_function = null
      conditions = [{
        members       = ["user:user2@example.com"], ip_subnetworks = null,
        negate = null, regions       = null, required_access_levels = null
      }]
    }
  }
  service_perimeters_regular = {
    r1 = {
      spec = null
      status = {
        access_levels       = [module.test.access_level_names["a1"], "a2"]
        resources           = ["projects/11111", "projects/111111"]
        restricted_services = ["storage.googleapis.com"]
        # example: allow writing to external GCS bucket
        egress_policies     = [
          {
            egress_from = {
              identity_type = null
              identities = [
                "serviceAccount:foo@myproject.iam.gserviceaccount.com"
              ]
            }
            egress_to = {
              operations = [{
                method_selectors = ["*"], service_name = "storage.googleapis.com"
              }]
              resources = ["projects/123456789"]
            }
          }
        ]
        # example: allow management from external automation SA
        ingress_policies    = [
          {
            ingress_from = {
              identities = [
                "serviceAccount:test-tf@myproject.iam.gserviceaccount.com",
              ],
              source_access_levels = ["*"], identity_type = null, source_resources = null
            }
            ingress_to = {
              operations = [{ method_selectors = [], service_name = "*" }]
              resources  = ["*"]
            }
          }
        ]
        vpc_accessible_services = {
          allowed_services   = ["storage.googleapis.com"]
          enable_restriction = true
        }
      }
      use_explicit_dry_run_spec = false
    }
  }
}
# tftest modules=1 resources=3
```

## Notes

- To remove an access level, first remove the binding between perimeter and the access level in `status` and/or `spec` without removing the access level itself. Once you have run `terraform apply`, you'll then be able to remove the access level and run `terraform apply` again.

## TODO

- [ ] implement support for the  `google_access_context_manager_gcp_user_access_binding` resource
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [access_policy](variables.tf#L55) | Access Policy name, leave null to use auto-created one. | <code>string</code> | ✓ |  |
| [access_levels](variables.tf#L17) | Map of access levels in name => [conditions] format. | <code title="map&#40;object&#40;&#123;&#10;  combining_function &#61; string&#10;  conditions &#61; list&#40;object&#40;&#123;&#10;    ip_subnetworks         &#61; list&#40;string&#41;&#10;    members                &#61; list&#40;string&#41;&#10;    negate                 &#61; bool&#10;    regions                &#61; list&#40;string&#41;&#10;    required_access_levels &#61; list&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [access_policy_create](variables.tf#L60) | Access Policy configuration, fill in to create. Parent is in 'organizations/123456' format. | <code title="object&#40;&#123;&#10;  parent &#61; string&#10;  title  &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [service_perimeters_bridge](variables.tf#L69) | Bridge service perimeters. | <code title="map&#40;object&#40;&#123;&#10;  spec_resources            &#61; list&#40;string&#41;&#10;  status_resources          &#61; list&#40;string&#41;&#10;  use_explicit_dry_run_spec &#61; bool&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [service_perimeters_regular](variables.tf#L79) | Regular service perimeters. | <code title="map&#40;object&#40;&#123;&#10;  spec &#61; object&#40;&#123;&#10;    access_levels       &#61; list&#40;string&#41;&#10;    resources           &#61; list&#40;string&#41;&#10;    restricted_services &#61; list&#40;string&#41;&#10;    egress_policies &#61; list&#40;object&#40;&#123;&#10;      egress_from &#61; object&#40;&#123;&#10;        identity_type &#61; string&#10;        identities    &#61; list&#40;string&#41;&#10;      &#125;&#41;&#10;      egress_to &#61; object&#40;&#123;&#10;        operations &#61; list&#40;object&#40;&#123;&#10;          method_selectors &#61; list&#40;string&#41;&#10;          service_name     &#61; string&#10;        &#125;&#41;&#41;&#10;        resources &#61; list&#40;string&#41;&#10;      &#125;&#41;&#10;    &#125;&#41;&#41;&#10;    ingress_policies &#61; list&#40;object&#40;&#123;&#10;      ingress_from &#61; object&#40;&#123;&#10;        identity_type        &#61; string&#10;        identities           &#61; list&#40;string&#41;&#10;        source_access_levels &#61; list&#40;string&#41;&#10;        source_resources     &#61; list&#40;string&#41;&#10;      &#125;&#41;&#10;      ingress_to &#61; object&#40;&#123;&#10;        operations &#61; list&#40;object&#40;&#123;&#10;          method_selectors &#61; list&#40;string&#41;&#10;          service_name     &#61; string&#10;        &#125;&#41;&#41;&#10;        resources &#61; list&#40;string&#41;&#10;      &#125;&#41;&#10;    &#125;&#41;&#41;&#10;    vpc_accessible_services &#61; object&#40;&#123;&#10;      allowed_services   &#61; list&#40;string&#41;&#10;      enable_restriction &#61; bool&#10;    &#125;&#41;&#10;  &#125;&#41;&#10;  status &#61; object&#40;&#123;&#10;    access_levels       &#61; list&#40;string&#41;&#10;    resources           &#61; list&#40;string&#41;&#10;    restricted_services &#61; list&#40;string&#41;&#10;    egress_policies &#61; list&#40;object&#40;&#123;&#10;      egress_from &#61; object&#40;&#123;&#10;        identity_type &#61; string&#10;        identities    &#61; list&#40;string&#41;&#10;      &#125;&#41;&#10;      egress_to &#61; object&#40;&#123;&#10;        operations &#61; list&#40;object&#40;&#123;&#10;          method_selectors &#61; list&#40;string&#41;&#10;          service_name     &#61; string&#10;        &#125;&#41;&#41;&#10;        resources &#61; list&#40;string&#41;&#10;      &#125;&#41;&#10;    &#125;&#41;&#41;&#10;    ingress_policies &#61; list&#40;object&#40;&#123;&#10;      ingress_from &#61; object&#40;&#123;&#10;        identity_type        &#61; string&#10;        identities           &#61; list&#40;string&#41;&#10;        source_access_levels &#61; list&#40;string&#41;&#10;        source_resources     &#61; list&#40;string&#41;&#10;      &#125;&#41;&#10;      ingress_to &#61; object&#40;&#123;&#10;        operations &#61; list&#40;object&#40;&#123;&#10;          method_selectors &#61; list&#40;string&#41;&#10;          service_name     &#61; string&#10;        &#125;&#41;&#41;&#10;        resources &#61; list&#40;string&#41;&#10;      &#125;&#41;&#10;    &#125;&#41;&#41;&#10;    vpc_accessible_services &#61; object&#40;&#123;&#10;      allowed_services   &#61; list&#40;string&#41;&#10;      enable_restriction &#61; bool&#10;    &#125;&#41;&#10;  &#125;&#41;&#10;  use_explicit_dry_run_spec &#61; bool&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [access_level_names](outputs.tf#L17) | Access level resources. |  |
| [access_levels](outputs.tf#L25) | Access level resources. |  |
| [access_policy](outputs.tf#L30) | Access policy resource, if autocreated. |  |
| [access_policy_name](outputs.tf#L35) | Access policy name. |  |
| [service_perimeters_bridge](outputs.tf#L40) | Bridge service perimeter resources. |  |
| [service_perimeters_regular](outputs.tf#L45) | Regular service perimeter resources. |  |

<!-- END TFDOC -->
