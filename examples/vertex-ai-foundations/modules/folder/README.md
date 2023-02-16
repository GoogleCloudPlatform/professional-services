# Google Cloud Folder Module

This module allows the creation and management of folders, including support for IAM bindings, organization policies, and hierarchical firewall rules.

## Examples

### IAM bindings

```hcl
module "folder" {
  source = "./fabric/modules/folder"
  parent = "organizations/1234567890"
  name  = "Folder name"
  group_iam       = {
    "cloud-owners@example.org" = [
        "roles/owner",
        "roles/resourcemanager.projectCreator"
    ]
  }
  iam = {
    "roles/owner" = ["user:one@example.com"]
  }
}
# tftest modules=1 resources=3
```

### Organization policies

To manage organization policies, the `orgpolicy.googleapis.com` service should be enabled in the quota project.

```hcl
module "folder" {
  source = "./fabric/modules/folder"
  parent = "organizations/1234567890"
  name  = "Folder name"
  org_policies = {
    "compute.disableGuestAttributesAccess" = {
      enforce = true
    }
    "constraints/compute.skipDefaultNetworkCreation" = {
      enforce = true
    }
    "iam.disableServiceAccountKeyCreation" = {
      enforce = true
    }
    "iam.disableServiceAccountKeyUpload" = {
      enforce = false
      rules = [
        {
          condition = {
            expression  = "resource.matchTagId(\"tagKeys/1234\", \"tagValues/1234\")"
            title       = "condition"
            description = "test condition"
            location    = "somewhere"
          }
          enforce = true
        }
      ]
    }
    "constraints/iam.allowedPolicyMemberDomains" = {
      allow = {
        values = ["C0xxxxxxx", "C0yyyyyyy"]
      }
    }
    "constraints/compute.trustedImageProjects" = {
      allow = {
        values = ["projects/my-project"]
      }
    }
    "constraints/compute.vmExternalIpAccess" = {
      deny = { all = true }
    }
  }
}
# tftest modules=1 resources=8
```

### Organization policy factory

See the [organization policy factory in the project module](../project#organization-policy-factory).

### Firewall policy factory

In the same way as for the [organization](../organization) module, the in-built factory allows you to define a single policy, using one file for rules, and an optional file for CIDR range substitution variables. Remember that non-absolute paths are relative to the root module (the folder where you run `terraform`).

```hcl
module "folder" {
  source          = "./fabric/modules/folder"
  parent = "organizations/1234567890"
  name  = "Folder name"
  firewall_policy_factory = {
    cidr_file   = "data/cidrs.yaml"
    policy_name = null
    rules_file  = "data/rules.yaml"
  }
  firewall_policy_association = {
    factory-policy = module.folder.firewall_policy_id["factory"]
  }
}
# tftest skip
```

```yaml
# cidrs.yaml

rfc1918:
  - 10.0.0.0/8
  - 172.16.0.0/12
  - 192.168.0.0/16
```

```yaml
# rules.yaml

allow-admins:
  description: Access from the admin subnet to all subnets
  direction: INGRESS
  action: allow
  priority: 1000
  ranges:
    - $rfc1918
  ports:
    all: []
  target_resources: null
  enable_logging: false

allow-ssh-from-iap:
  description: Enable SSH from IAP
  direction: INGRESS
  action: allow
  priority: 1002
  ranges:
    - 35.235.240.0/20
  ports:
    tcp: ["22"]
  target_resources: null
  enable_logging: false
```

### Logging Sinks

```hcl
module "gcs" {
  source        = "./fabric/modules/gcs"
  project_id    = "my-project"
  name          = "gcs_sink"
  force_destroy = true
}

module "dataset" {
  source     = "./fabric/modules/bigquery-dataset"
  project_id = "my-project"
  id         = "bq_sink"
}

module "pubsub" {
  source     = "./fabric/modules/pubsub"
  project_id = "my-project"
  name       = "pubsub_sink"
}

module "bucket" {
  source      = "./fabric/modules/logging-bucket"
  parent_type = "project"
  parent      = "my-project"
  id          = "bucket"
}

module "folder-sink" {
  source = "./fabric/modules/folder"
  parent = "folders/657104291943"
  name   = "my-folder"
  logging_sinks = {
    warnings = {
      type             = "storage"
      destination      = module.gcs.id
      filter           = "severity=WARNING"
      include_children = true
      exclusions       = {}
    }
    info = {
      type             = "bigquery"
      destination      = module.dataset.id
      filter           = "severity=INFO"
      include_children = true
      exclusions       = {}
    }
    notice = {
      type             = "pubsub"
      destination      = module.pubsub.id
      filter           = "severity=NOTICE"
      include_children = true
      exclusions       = {}
    }
    debug = {
      type             = "logging"
      destination      = module.bucket.id
      filter           = "severity=DEBUG"
      include_children = true
      exclusions = {
        no-compute = "logName:compute"
      }
    }
  }
  logging_exclusions = {
    no-gce-instances = "resource.type=gce_instance"
  }
}
# tftest modules=5 resources=14
```

### Hierarchical firewall policies

```hcl
module "folder1" {
  source = "./fabric/modules/folder"
  parent = var.organization_id
  name   = "policy-container"

  firewall_policies = {
    iap-policy = {
      allow-iap-ssh = {
        description             = "Always allow ssh from IAP"
        direction               = "INGRESS"
        action                  = "allow"
        priority                = 100
        ranges                  = ["35.235.240.0/20"]
        ports                   = { tcp = ["22"] }
        target_service_accounts = null
        target_resources        = null
        logging                 = false
      }
    }
  }
  firewall_policy_association = {
    iap-policy = "iap-policy"
  }
}

module "folder2" {
  source = "./fabric/modules/folder"
  parent = var.organization_id
  name   = "hf2"
  firewall_policy_association = {
    iap-policy = module.folder1.firewall_policy_id["iap-policy"]
  }
}
# tftest modules=2 resources=6
```

## Tags

Refer to the [Creating and managing tags](https://cloud.google.com/resource-manager/docs/tags/tags-creating-and-managing) documentation for details on usage.

```hcl
module "org" {
  source          = "./fabric/modules/organization"
  organization_id = var.organization_id
  tags = {
    environment = {
      description  = "Environment specification."
      iam          = null
      values = {
        dev  = null
        prod = null
      }
    }
  }
}

module "folder" {
  source = "./fabric/modules/folder"
  name   = "Test"
  parent = module.org.organization_id
  tag_bindings = {
    env-prod = module.org.tag_values["environment/prod"].id
    foo      = "tagValues/12345678"
  }
}
# tftest modules=2 resources=6
```

<!-- TFDOC OPTS files:1 -->
<!-- BEGIN TFDOC -->

## Files

| name | description | resources |
|---|---|---|
| [firewall-policies.tf](./firewall-policies.tf) | None | <code>google_compute_firewall_policy</code> · <code>google_compute_firewall_policy_association</code> · <code>google_compute_firewall_policy_rule</code> |
| [iam.tf](./iam.tf) | IAM bindings, roles and audit logging resources. | <code>google_folder_iam_binding</code> · <code>google_folder_iam_member</code> |
| [logging.tf](./logging.tf) | Log sinks and supporting resources. | <code>google_bigquery_dataset_iam_member</code> · <code>google_logging_folder_exclusion</code> · <code>google_logging_folder_sink</code> · <code>google_project_iam_member</code> · <code>google_pubsub_topic_iam_member</code> · <code>google_storage_bucket_iam_member</code> |
| [main.tf](./main.tf) | Module-level locals and resources. | <code>google_essential_contacts_contact</code> · <code>google_folder</code> |
| [organization-policies.tf](./organization-policies.tf) | Folder-level organization policies. | <code>google_org_policy_policy</code> |
| [outputs.tf](./outputs.tf) | Module outputs. |  |
| [tags.tf](./tags.tf) | None | <code>google_tags_tag_binding</code> |
| [variables.tf](./variables.tf) | Module variables. |  |
| [versions.tf](./versions.tf) | Version pins. |  |

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [contacts](variables.tf#L17) | List of essential contacts for this resource. Must be in the form EMAIL -> [NOTIFICATION_TYPES]. Valid notification types are ALL, SUSPENSION, SECURITY, TECHNICAL, BILLING, LEGAL, PRODUCT_UPDATES. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [firewall_policies](variables.tf#L24) | Hierarchical firewall policies created in this folder. | <code title="map&#40;map&#40;object&#40;&#123;&#10;  action                  &#61; string&#10;  description             &#61; string&#10;  direction               &#61; string&#10;  logging                 &#61; bool&#10;  ports                   &#61; map&#40;list&#40;string&#41;&#41;&#10;  priority                &#61; number&#10;  ranges                  &#61; list&#40;string&#41;&#10;  target_resources        &#61; list&#40;string&#41;&#10;  target_service_accounts &#61; list&#40;string&#41;&#10;&#125;&#41;&#41;&#41;">map&#40;map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [firewall_policy_association](variables.tf#L41) | The hierarchical firewall policy to associate to this folder. Must be either a key in the `firewall_policies` map or the id of a policy defined somewhere else. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [firewall_policy_factory](variables.tf#L48) | Configuration for the firewall policy factory. | <code title="object&#40;&#123;&#10;  cidr_file   &#61; string&#10;  policy_name &#61; string&#10;  rules_file  &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [folder_create](variables.tf#L58) | Create folder. When set to false, uses id to reference an existing folder. | <code>bool</code> |  | <code>true</code> |
| [group_iam](variables.tf#L64) | Authoritative IAM binding for organization groups, in {GROUP_EMAIL => [ROLES]} format. Group emails need to be static. Can be used in combination with the `iam` variable. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam](variables.tf#L71) | IAM bindings in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam_additive](variables.tf#L78) | Non authoritative IAM bindings, in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam_additive_members](variables.tf#L85) | IAM additive bindings in {MEMBERS => [ROLE]} format. This might break if members are dynamic values. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [id](variables.tf#L92) | Folder ID in case you use folder_create=false. | <code>string</code> |  | <code>null</code> |
| [logging_exclusions](variables.tf#L98) | Logging exclusions for this folder in the form {NAME -> FILTER}. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [logging_sinks](variables.tf#L105) | Logging sinks to create for this folder. | <code title="map&#40;object&#40;&#123;&#10;  destination      &#61; string&#10;  type             &#61; string&#10;  filter           &#61; string&#10;  include_children &#61; bool&#10;  exclusions &#61; map&#40;string&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [name](variables.tf#L126) | Folder name. | <code>string</code> |  | <code>null</code> |
| [org_policies](variables.tf#L132) | Organization policies applied to this folder keyed by policy name. | <code title="map&#40;object&#40;&#123;&#10;  inherit_from_parent &#61; optional&#40;bool&#41; &#35; for list policies only.&#10;  reset               &#61; optional&#40;bool&#41;&#10;  allow &#61; optional&#40;object&#40;&#123;&#10;    all    &#61; optional&#40;bool&#41;&#10;    values &#61; optional&#40;list&#40;string&#41;&#41;&#10;  &#125;&#41;&#41;&#10;  deny &#61; optional&#40;object&#40;&#123;&#10;    all    &#61; optional&#40;bool&#41;&#10;    values &#61; optional&#40;list&#40;string&#41;&#41;&#10;  &#125;&#41;&#41;&#10;  enforce &#61; optional&#40;bool, true&#41; &#35; for boolean policies only.&#10;  rules &#61; optional&#40;list&#40;object&#40;&#123;&#10;    allow &#61; optional&#40;object&#40;&#123;&#10;      all    &#61; optional&#40;bool&#41;&#10;      values &#61; optional&#40;list&#40;string&#41;&#41;&#10;    &#125;&#41;&#41;&#10;    deny &#61; optional&#40;object&#40;&#123;&#10;      all    &#61; optional&#40;bool&#41;&#10;      values &#61; optional&#40;list&#40;string&#41;&#41;&#10;    &#125;&#41;&#41;&#10;    enforce &#61; optional&#40;bool, true&#41; &#35; for boolean policies only.&#10;    condition &#61; object&#40;&#123;&#10;      description &#61; optional&#40;string&#41;&#10;      expression  &#61; optional&#40;string&#41;&#10;      location    &#61; optional&#40;string&#41;&#10;      title       &#61; optional&#40;string&#41;&#10;    &#125;&#41;&#10;  &#125;&#41;&#41;, &#91;&#93;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [org_policies_data_path](variables.tf#L172) | Path containing org policies in YAML format. | <code>string</code> |  | <code>null</code> |
| [parent](variables.tf#L178) | Parent in folders/folder_id or organizations/org_id format. | <code>string</code> |  | <code>null</code> |
| [tag_bindings](variables.tf#L188) | Tag bindings for this folder, in key => tag value id format. | <code>map&#40;string&#41;</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [firewall_policies](outputs.tf#L16) | Map of firewall policy resources created in this folder. |  |
| [firewall_policy_id](outputs.tf#L21) | Map of firewall policy ids created in this folder. |  |
| [folder](outputs.tf#L26) | Folder resource. |  |
| [id](outputs.tf#L31) | Folder id. |  |
| [name](outputs.tf#L40) | Folder name. |  |
| [sink_writer_identities](outputs.tf#L45) | Writer identities created for each sink. |  |

<!-- END TFDOC -->
