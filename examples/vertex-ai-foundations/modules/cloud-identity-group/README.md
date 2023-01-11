# Cloud Identity Group Module

This module allows creating a Cloud Identity group and assigning members.

## Usage
To use this module you must either run terraform as a user that has the Groups Admin role in Cloud Identity or [enable domain-wide delegation](https://developers.google.com/admin-sdk/directory/v1/guides/delegation) to the service account used by terraform. If you use a service account, you must also grant that service account the Groups Admin role in Cloud Identity.

Please note that the underlying terraform resources only allow the creation of groups with members that are part of the organization. If you want to create memberships for identities outside your own organization, you have to manually allow members outside your organization in the Cloud Identity admin console.

As of version 4.34 of the GCP Terraform provider one operation is not working:
- removing a group that has at least one OWNER managed by terraform ([bug](https://github.com/hashicorp/terraform-provider-google/issues/7617))

Until that bug is fixed, this module will only support the creation of MEMBER and MANAGER memberships.

## Examples

### Simple Group
```hcl
module "group" {
  source       = "./fabric/modules/cloud-identity-group"
  customer_id  = "customers/C01234567"
  name         = "mygroup@example.com"
  display_name = "My group name"
  description  = "My group Description"
  members = [
    "user1@example.com",
    "user2@example.com",
    "service-account@my-gcp-project.iam.gserviceaccount.com"
  ]
}
# tftest modules=1 resources=4
```

### Group with managers
```hcl
module "group" {
  source       = "./fabric/modules/cloud-identity-group"
  customer_id  = "customers/C01234567"
  name         = "mygroup2@example.com"
  display_name = "My group name 2"
  description  = "My group 2 Description"
  members = [
    "user1@example.com",
    "user2@example.com",
    "service-account@my-gcp-project.iam.gserviceaccount.com"
  ]
  managers = [
    "user3@example.com"
  ]  
}
# tftest modules=1 resources=5
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [customer_id](variables.tf#L17) | Directory customer ID in the form customers/C0xxxxxxx. | <code>string</code> | ✓ |  |
| [display_name](variables.tf#L32) | Group display name. | <code>string</code> | ✓ |  |
| [name](variables.tf#L49) | Group ID (usually an email). | <code>string</code> | ✓ |  |
| [description](variables.tf#L26) | Group description. | <code>string</code> |  | <code>null</code> |
| [managers](variables.tf#L37) | List of group managers. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [members](variables.tf#L43) | List of group members. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [id](outputs.tf#L17) | Group ID. |  |
| [name](outputs.tf#L22) | Group name. |  |

<!-- END TFDOC -->
