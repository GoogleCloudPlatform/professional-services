# Organization Module

This module allows managing several organization properties:

- IAM bindings, both authoritative and additive
- custom IAM roles
- audit logging configuration for services
- organization policies
- organization policy custom constraints

To manage organization policies, the `orgpolicy.googleapis.com` service should be enabled in the quota project.

## TOC

<!-- BEGIN TOC -->
- [TOC](#toc)
- [Example](#example)
- [IAM](#iam)
- [Organization Policies](#organization-policies)
  - [Organization Policy Factory](#organization-policy-factory)
  - [Organization Policy Custom Constraints](#organization-policy-custom-constraints)
  - [Organization Policy Custom Constraints Factory](#organization-policy-custom-constraints-factory)
- [Hierarchical Firewall Policy Attachments](#hierarchical-firewall-policy-attachments)
- [Log Sinks](#log-sinks)
- [Data Access Logs](#data-access-logs)
- [Custom Roles](#custom-roles)
  - [Custom Roles Factory](#custom-roles-factory)
- [Tags](#tags)
- [Files](#files)
- [Variables](#variables)
- [Outputs](#outputs)
<!-- END TOC -->

## Example

```hcl
module "org" {
  source          = "./fabric/modules/organization"
  organization_id = var.organization_id
  iam_by_principals = {
    "group:${var.group_email}" = ["roles/owner"]
  }
  iam = {
    "roles/resourcemanager.projectCreator" = ["group:${var.group_email}"]
  }
  iam_bindings_additive = {
    am1-storage-admin = {
      member = "group:${var.group_email}"
      role   = "roles/storage.admin"
    }
  }
  tags = {
    allowexternal = {
      description = "Allow external identities."
      values = {
        true = {}, false = {}
      }
    }
  }
  org_policies = {
    "compute.disableGuestAttributesAccess" = {
      rules = [{ enforce = true }]
    }
    "compute.skipDefaultNetworkCreation" = {
      rules = [{ enforce = true }]
    }
    "iam.disableServiceAccountKeyCreation" = {
      rules = [{ enforce = true }]
    }
    "iam.disableServiceAccountKeyUpload" = {
      rules = [
        {
          condition = {
            expression  = "resource.matchTagId('tagKeys/1234', 'tagValues/1234')"
            title       = "condition"
            description = "test condition"
            location    = "somewhere"
          }
          enforce = true
        },
        {
          enforce = false
        }
      ]
    }
    "iam.allowedPolicyMemberDomains" = {
      rules = [
        {
          allow = { all = true }
          condition = {
            expression  = "resource.matchTag('1234567890/allowexternal', 'true')"
            title       = "Allow external identities"
            description = "Allow external identities when resource has the `allowexternal` tag set to true."
          }
        },
        {
          allow = { values = ["C0xxxxxxx", "C0yyyyyyy"] }
          condition = {
            expression  = "!resource.matchTag('1234567890/allowexternal', 'true')"
            title       = ""
            description = "For any resource without allowexternal=true, only allow identities from restricted domains."
          }
        }
      ]
    }
    "compute.trustedImageProjects" = {
      rules = [{
        allow = {
          values = ["projects/my-project"]
        }
      }]
    }
    "compute.vmExternalIpAccess" = {
      rules = [{ deny = { all = true } }]
    }
  }
}
# tftest modules=1 resources=13 inventory=basic.yaml e2e serial
```

## IAM

IAM is managed via several variables that implement different features and levels of control:

- `iam` and `iam_by_principals` configure authoritative bindings that manage individual roles exclusively, and are internally merged
- `iam_bindings` configure authoritative bindings with optional support for conditions, and are not internally merged with the previous two variables
- `iam_bindings_additive` configure additive bindings via individual role/member pairs with optional support  conditions

The authoritative and additive approaches can be used together, provided different roles are managed by each. Some care must also be taken with the `iam_by_principals` variable to ensure that variable keys are static values, so that Terraform is able to compute the dependency graph.

Refer to the [project module](../project/README.md#iam) for examples of the IAM interface.

## Organization Policies

### Organization Policy Factory

See the [organization policy factory in the project module](../project#organization-policy-factory).

### Organization Policy Custom Constraints

Refer to the [Creating and managing custom constraints](https://cloud.google.com/resource-manager/docs/organization-policy/creating-managing-custom-constraints) documentation for details on usage.
To manage organization policy custom constraints, the `orgpolicy.googleapis.com` service should be enabled in the quota project.

```hcl
module "org" {
  source          = "./fabric/modules/organization"
  organization_id = var.organization_id
  org_policy_custom_constraints = {
    "custom.gkeEnableAutoUpgrade" = {
      resource_types = ["container.googleapis.com/NodePool"]
      method_types   = ["CREATE"]
      condition      = "resource.management.autoUpgrade == true"
      action_type    = "ALLOW"
      display_name   = "Enable node auto-upgrade"
      description    = "All node pools must have node auto-upgrade enabled."
    }
  }
  # not necessarily to enforce on the org level, policy may be applied on folder/project levels
  org_policies = {
    "custom.gkeEnableAutoUpgrade" = {
      rules = [{ enforce = true }]
    }
  }
}
# tftest modules=1 resources=2 inventory=custom-constraints.yaml
```

You can use the `id` or `custom_constraint_ids` outputs to prevent race conditions between the creation of a custom constraint and an organization policy using that constraint. Both of these outputs depend on the actual constraint, which would make any resource referring to them to wait for the creation of the constraint.

### Organization Policy Custom Constraints Factory

Org policy custom constraints can be loaded from a directory containing YAML files where each file defines one or more custom constraints. The structure of the YAML files is exactly the same as the `org_policy_custom_constraints` variable.

The example below deploys a few org policy custom constraints split between two YAML files.

```hcl
module "org" {
  source          = "./fabric/modules/organization"
  organization_id = var.organization_id
  factories_config = {
    org_policy_custom_constraints = "configs/custom-constraints"
  }
  org_policies = {
    "custom.gkeEnableAutoUpgrade" = {
      rules = [{ enforce = true }]
    }
  }
}
# tftest modules=1 resources=3 files=gke inventory=custom-constraints.yaml
```

```yaml
# tftest-file id=gke path=configs/custom-constraints/gke.yaml

---
# Terraform will be unable to decode this file if it does not contain valid YAML
# You can retain `---` (start of the document) to indicate an empty document.

custom.gkeEnableLogging:
  resource_types:
  - container.googleapis.com/Cluster
  method_types:
  - CREATE
  - UPDATE
  condition: resource.loggingService == "none"
  action_type: DENY
  display_name: Do not disable Cloud Logging
custom.gkeEnableAutoUpgrade:
  resource_types:
  - container.googleapis.com/NodePool
  method_types:
  - CREATE
  condition: resource.management.autoUpgrade == true
  action_type: ALLOW
  display_name: Enable node auto-upgrade
  description: All node pools must have node auto-upgrade enabled.
```

```yaml
# tftest-file id=dataproc path=configs/custom-constraints/dataproc.yaml

---
# Terraform will be unable to decode this file if it does not contain valid YAML
# You can retain `---` (start of the document) to indicate an empty document.

custom.dataprocNoMoreThan10Workers:
  resource_types:
  - dataproc.googleapis.com/Cluster
  method_types:
  - CREATE
  - UPDATE
  condition: resource.config.workerConfig.numInstances + resource.config.secondaryWorkerConfig.numInstances > 10
  action_type: DENY
  display_name: Total number of worker instances cannot be larger than 10
  description: Cluster cannot have more than 10 workers, including primary and secondary workers.
```

## Hierarchical Firewall Policy Attachments

Hierarchical firewall policies can be managed via the [`net-firewall-policy`](../net-firewall-policy/) module, including support for factories. Once a policy is available, attaching it to the organization can be done either in the firewall policy module itself, or here:

```hcl
module "firewall-policy" {
  source    = "./fabric/modules/net-firewall-policy"
  name      = "test-1"
  parent_id = var.organization_id
  # attachment via the firewall policy module
  # attachments = {
  #   org = var.organization_id
  # }
}

module "org" {
  source          = "./fabric/modules/organization"
  organization_id = var.organization_id
  # attachment via the organization module
  firewall_policy = {
    name   = "test-1"
    policy = module.firewall-policy.id
  }
}
# tftest modules=2 resources=2 e2e serial
```

## Log Sinks

The following example shows how to define organization-level log sinks:

```hcl
module "gcs" {
  source        = "./fabric/modules/gcs"
  project_id    = var.project_id
  prefix        = var.prefix
  name          = "gcs_sink"
  force_destroy = true
}

module "dataset" {
  source     = "./fabric/modules/bigquery-dataset"
  project_id = var.project_id
  id         = "bq_sink"
}

module "pubsub" {
  source     = "./fabric/modules/pubsub"
  project_id = var.project_id
  name       = "pubsub_sink"
}

module "bucket" {
  source      = "./fabric/modules/logging-bucket"
  parent_type = "project"
  parent      = var.project_id
  id          = "${var.prefix}-bucket"
}

module "destination-project" {
  source          = "./fabric/modules/project"
  name            = "dest-prj"
  billing_account = var.billing_account_id
  parent          = var.folder_id
  prefix          = var.prefix
  services = [
    "logging.googleapis.com"
  ]
}

module "org" {
  source          = "./fabric/modules/organization"
  organization_id = var.organization_id

  logging_sinks = {
    warnings = {
      destination = module.gcs.id
      filter      = "severity=WARNING"
      type        = "storage"
    }
    info = {
      bq_partitioned_table = true
      destination          = module.dataset.id
      filter               = "severity=INFO"
      type                 = "bigquery"
    }
    notice = {
      destination = module.pubsub.id
      filter      = "severity=NOTICE"
      type        = "pubsub"
    }
    debug = {
      destination = module.bucket.id
      filter      = "severity=DEBUG"
      exclusions = {
        no-compute = "logName:compute"
      }
      type = "logging"
    }
    alert = {
      destination = module.destination-project.id
      filter      = "severity=ALERT"
      type        = "project"
    }
  }
  logging_exclusions = {
    no-gce-instances = "resource.type=gce_instance"
  }
}
# tftest modules=6 resources=17 inventory=logging.yaml e2e serial
```

## Data Access Logs

Activation of data access logs can be controlled via the `logging_data_access` variable.

```hcl
module "org" {
  source          = "./fabric/modules/organization"
  organization_id = var.organization_id
  logging_data_access = {
    allServices = {
      # logs for principals listed here will be excluded
      ADMIN_READ = ["group:${var.group_email}"]
    }
    "storage.googleapis.com" = {
      DATA_READ  = []
      DATA_WRITE = []
    }
  }
}
# tftest modules=1 resources=2 inventory=logging-data-access.yaml e2e serial
```

## Custom Roles

Custom roles can be defined via the `custom_roles` variable, and referenced via the `custom_role_id` output (this also provides explicit dependency on the custom role):

```hcl
module "org" {
  source          = "./fabric/modules/organization"
  organization_id = var.organization_id
  custom_roles = {
    "myRole" = [
      "compute.instances.list",
    ]
  }
  iam = {
    (module.org.custom_role_id.myRole) = ["group:${var.group_email}"]
  }
}
# tftest modules=1 resources=2 inventory=roles.yaml e2e serial
```

### Custom Roles Factory

Custom roles can also be specified via a factory in a similar way to organization policies and policy constraints. Each file is mapped to a custom role, where

- the role name defaults to the file name but can be overridden via a `name` attribute in the yaml
- role permissions are defined in an `includedPermissions` map

Custom roles defined via the variable are merged with those coming from the factory, and override them in case of duplicate names.

```hcl
module "org" {
  source          = "./fabric/modules/organization"
  organization_id = var.organization_id
  factories_config = {
    custom_roles = "data/custom_roles"
  }
}
# tftest modules=1 resources=2 files=custom-role-1,custom-role-2 inventory=custom-roles.yaml
```

```yaml
# tftest-file id=custom-role-1 path=data/custom_roles/test_1.yaml

includedPermissions:
 - compute.globalOperations.get
```

```yaml
# tftest-file id=custom-role-2 path=data/custom_roles/test_2.yaml

name: projectViewer
includedPermissions:
  - resourcemanager.projects.get
  - resourcemanager.projects.getIamPolicy
  - resourcemanager.projects.list
```

## Tags

Refer to the [Creating and managing tags](https://cloud.google.com/resource-manager/docs/tags/tags-creating-and-managing) documentation for details on usage.

```hcl
module "org" {
  source          = "./fabric/modules/organization"
  organization_id = var.organization_id
  tags = {
    environment = {
      description = "Environment specification."
      iam = {
        "roles/resourcemanager.tagAdmin" = ["group:${var.group_email}"]
      }
      values = {
        dev = {}
        prod = {
          description = "Environment: production."
          iam = {
            "roles/resourcemanager.tagViewer" = ["group:${var.group_email}"]
          }
        }
      }
    }
  }
  tag_bindings = {
    env-prod = module.org.tag_values["environment/prod"].id
  }
}
# tftest modules=1 resources=6 inventory=tags.yaml e2e serial
```

You can also define network tags, through a dedicated variable *network_tags*:

```hcl
module "org" {
  source          = "./fabric/modules/organization"
  organization_id = var.organization_id
  network_tags = {
    net-environment = {
      description = "This is a network tag."
      network     = "${var.project_id}/${var.vpc.name}"
      iam = {
        "roles/resourcemanager.tagAdmin" = ["group:${var.group_email}"]
      }
      values = {
        dev = {}
        prod = {
          description = "Environment: production."
          iam = {
            "roles/resourcemanager.tagUser" = ["group:${var.group_email}"]
          }
        }
      }
    }
  }
}
# tftest modules=1 resources=5 inventory=network-tags.yaml e2e serial
```

<!-- TFDOC OPTS files:1 -->
<!-- BEGIN TFDOC -->
## Files

| name | description | resources |
|---|---|---|
| [iam.tf](./iam.tf) | IAM bindings. | <code>google_organization_iam_binding</code> · <code>google_organization_iam_custom_role</code> · <code>google_organization_iam_member</code> |
| [logging.tf](./logging.tf) | Log sinks and data access logs. | <code>google_bigquery_dataset_iam_member</code> · <code>google_logging_organization_exclusion</code> · <code>google_logging_organization_settings</code> · <code>google_logging_organization_sink</code> · <code>google_organization_iam_audit_config</code> · <code>google_project_iam_member</code> · <code>google_pubsub_topic_iam_member</code> · <code>google_storage_bucket_iam_member</code> |
| [main.tf](./main.tf) | Module-level locals and resources. | <code>google_compute_firewall_policy_association</code> · <code>google_essential_contacts_contact</code> |
| [org-policy-custom-constraints.tf](./org-policy-custom-constraints.tf) | None | <code>google_org_policy_custom_constraint</code> |
| [organization-policies.tf](./organization-policies.tf) | Organization-level organization policies. | <code>google_org_policy_policy</code> |
| [outputs.tf](./outputs.tf) | Module outputs. |  |
| [tags.tf](./tags.tf) | None | <code>google_tags_tag_binding</code> · <code>google_tags_tag_key</code> · <code>google_tags_tag_key_iam_binding</code> · <code>google_tags_tag_value</code> · <code>google_tags_tag_value_iam_binding</code> |
| [variables-iam.tf](./variables-iam.tf) | None |  |
| [variables-tags.tf](./variables-tags.tf) | None |  |
| [variables.tf](./variables.tf) | Module variables. |  |
| [versions.tf](./versions.tf) | Version pins. |  |

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [organization_id](variables.tf#L155) | Organization id in organizations/nnnnnn format. | <code>string</code> | ✓ |  |
| [contacts](variables.tf#L17) | List of essential contacts for this resource. Must be in the form EMAIL -> [NOTIFICATION_TYPES]. Valid notification types are ALL, SUSPENSION, SECURITY, TECHNICAL, BILLING, LEGAL, PRODUCT_UPDATES. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [custom_roles](variables.tf#L24) | Map of role name => list of permissions to create in this project. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [factories_config](variables.tf#L31) | Paths to data files and folders that enable factory functionality. | <code title="object&#40;&#123;&#10;  custom_roles                  &#61; optional&#40;string&#41;&#10;  org_policies                  &#61; optional&#40;string&#41;&#10;  org_policy_custom_constraints &#61; optional&#40;string&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>&#123;&#125;</code> |
| [firewall_policy](variables.tf#L42) | Hierarchical firewall policies to associate to the organization. | <code title="object&#40;&#123;&#10;  name   &#61; string&#10;  policy &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [iam](variables-iam.tf#L17) | IAM bindings, in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam_bindings](variables-iam.tf#L24) | Authoritative IAM bindings in {KEY => {role = ROLE, members = [], condition = {}}}. Keys are arbitrary. | <code title="map&#40;object&#40;&#123;&#10;  members &#61; list&#40;string&#41;&#10;  role    &#61; string&#10;  condition &#61; optional&#40;object&#40;&#123;&#10;    expression  &#61; string&#10;    title       &#61; string&#10;    description &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam_bindings_additive](variables-iam.tf#L39) | Individual additive IAM bindings. Keys are arbitrary. | <code title="map&#40;object&#40;&#123;&#10;  member &#61; string&#10;  role   &#61; string&#10;  condition &#61; optional&#40;object&#40;&#123;&#10;    expression  &#61; string&#10;    title       &#61; string&#10;    description &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam_by_principals](variables-iam.tf#L54) | Authoritative IAM binding in {PRINCIPAL => [ROLES]} format. Principals need to be statically defined to avoid cycle errors. Merged internally with the `iam` variable. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [logging_data_access](variables.tf#L51) | Control activation of data access logs. Format is service => { log type => [exempted members]}. The special 'allServices' key denotes configuration for all services. | <code>map&#40;map&#40;list&#40;string&#41;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [logging_exclusions](variables.tf#L66) | Logging exclusions for this organization in the form {NAME -> FILTER}. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [logging_settings](variables.tf#L73) | Default settings for logging resources. | <code title="object&#40;&#123;&#10;  disable_default_sink &#61; optional&#40;bool&#41;&#10;  storage_location     &#61; optional&#40;string&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [logging_sinks](variables.tf#L83) | Logging sinks to create for the organization. | <code title="map&#40;object&#40;&#123;&#10;  bq_partitioned_table &#61; optional&#40;bool, false&#41;&#10;  description          &#61; optional&#40;string&#41;&#10;  destination          &#61; string&#10;  disabled             &#61; optional&#40;bool, false&#41;&#10;  exclusions           &#61; optional&#40;map&#40;string&#41;, &#123;&#125;&#41;&#10;  filter               &#61; optional&#40;string&#41;&#10;  iam                  &#61; optional&#40;bool, true&#41;&#10;  include_children     &#61; optional&#40;bool, true&#41;&#10;  type                 &#61; string&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [network_tags](variables-tags.tf#L17) | Network tags by key name. If `id` is provided, key creation is skipped. The `iam` attribute behaves like the similarly named one at module level. | <code title="map&#40;object&#40;&#123;&#10;  description &#61; optional&#40;string, &#34;Managed by the Terraform organization module.&#34;&#41;&#10;  iam         &#61; optional&#40;map&#40;list&#40;string&#41;&#41;, &#123;&#125;&#41;&#10;  id          &#61; optional&#40;string&#41;&#10;  network     &#61; string &#35; project_id&#47;vpc_name&#10;  values &#61; optional&#40;map&#40;object&#40;&#123;&#10;    description &#61; optional&#40;string, &#34;Managed by the Terraform organization module.&#34;&#41;&#10;    iam         &#61; optional&#40;map&#40;list&#40;string&#41;&#41;, &#123;&#125;&#41;&#10;  &#125;&#41;&#41;, &#123;&#125;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [org_policies](variables.tf#L114) | Organization policies applied to this organization keyed by policy name. | <code title="map&#40;object&#40;&#123;&#10;  inherit_from_parent &#61; optional&#40;bool&#41; &#35; for list policies only.&#10;  reset               &#61; optional&#40;bool&#41;&#10;  rules &#61; optional&#40;list&#40;object&#40;&#123;&#10;    allow &#61; optional&#40;object&#40;&#123;&#10;      all    &#61; optional&#40;bool&#41;&#10;      values &#61; optional&#40;list&#40;string&#41;&#41;&#10;    &#125;&#41;&#41;&#10;    deny &#61; optional&#40;object&#40;&#123;&#10;      all    &#61; optional&#40;bool&#41;&#10;      values &#61; optional&#40;list&#40;string&#41;&#41;&#10;    &#125;&#41;&#41;&#10;    enforce &#61; optional&#40;bool&#41; &#35; for boolean policies only.&#10;    condition &#61; optional&#40;object&#40;&#123;&#10;      description &#61; optional&#40;string&#41;&#10;      expression  &#61; optional&#40;string&#41;&#10;      location    &#61; optional&#40;string&#41;&#10;      title       &#61; optional&#40;string&#41;&#10;    &#125;&#41;, &#123;&#125;&#41;&#10;  &#125;&#41;&#41;, &#91;&#93;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [org_policy_custom_constraints](variables.tf#L141) | Organization policy custom constraints keyed by constraint name. | <code title="map&#40;object&#40;&#123;&#10;  display_name   &#61; optional&#40;string&#41;&#10;  description    &#61; optional&#40;string&#41;&#10;  action_type    &#61; string&#10;  condition      &#61; string&#10;  method_types   &#61; list&#40;string&#41;&#10;  resource_types &#61; list&#40;string&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [tag_bindings](variables-tags.tf#L45) | Tag bindings for this organization, in key => tag value id format. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [tags](variables-tags.tf#L52) | Tags by key name. If `id` is provided, key or value creation is skipped. The `iam` attribute behaves like the similarly named one at module level. | <code title="map&#40;object&#40;&#123;&#10;  description &#61; optional&#40;string, &#34;Managed by the Terraform organization module.&#34;&#41;&#10;  iam         &#61; optional&#40;map&#40;list&#40;string&#41;&#41;, &#123;&#125;&#41;&#10;  id          &#61; optional&#40;string&#41;&#10;  values &#61; optional&#40;map&#40;object&#40;&#123;&#10;    description &#61; optional&#40;string, &#34;Managed by the Terraform organization module.&#34;&#41;&#10;    iam         &#61; optional&#40;map&#40;list&#40;string&#41;&#41;, &#123;&#125;&#41;&#10;    id          &#61; optional&#40;string&#41;&#10;  &#125;&#41;&#41;, &#123;&#125;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [custom_constraint_ids](outputs.tf#L17) | Map of CUSTOM_CONSTRAINTS => ID in the organization. |  |
| [custom_role_id](outputs.tf#L22) | Map of custom role IDs created in the organization. |  |
| [custom_roles](outputs.tf#L32) | Map of custom roles resources created in the organization. |  |
| [id](outputs.tf#L37) | Fully qualified organization id. |  |
| [network_tag_keys](outputs.tf#L55) | Tag key resources. |  |
| [network_tag_values](outputs.tf#L64) | Tag value resources. |  |
| [organization_id](outputs.tf#L74) | Organization id dependent on module resources. |  |
| [sink_writer_identities](outputs.tf#L91) | Writer identities created for each sink. |  |
| [tag_keys](outputs.tf#L99) | Tag key resources. |  |
| [tag_values](outputs.tf#L108) | Tag value resources. |  |
<!-- END TFDOC -->
