# ![Custom Role Manager](img/logo.png "Custom Role Manager")

Custom Role Manager is a tool that can be used to keep custom roles up to date. You can
source permissions from either testable permissions of a resource or from another role or
set of roles.

The tool will either create the specified roles, or update them with added or removed
permissions. It can also output Terraform compatible definitions for the roles.

## Setup

Requirements:

  - Python 3.6+
  - Dependencies installed from [`requirements.txt`](requirements.txt) 
    (eg. `pip3 install -r requirements.txt`)

The tool requires one of the following permissions:

  - For managing organization-wide roles: `roles/iam.organizationRoleAdmin`
  - For managing project-specific roles: `roles/iam.roleAdmin`

## Configuration

The configuration format is a YAML file. The custom roles are configured under the `roles`
key in a list:

  - `id`: Role ID (A role ID may contain alphanumeric characters, underscores (_), and periods (.) and must 
     contain a minimum of 3 characters and a maximum of 64 characters.)
  - `tfId`: Terraform resource ID (optional)
  - `title`: A title for the role (max. 100 UTF-8 bytes)
  - `description`: A human-readable description for the role.
  - `stage`: Release stage for the role (one of: `ALPHA`, `BETA`, `GA`, `EAP`)
  - `source`: Source for the roles privileges. It can be either `roles/some.predefined.role` 
    (eg. `roles/storage.admin`) or a GCP resource like `//someapi.googleapis.com/resource-type/resource-id` 
    (eg. `//cloudresourcemanager.googleapis.com/projects/12345`) which [queryTestablePermissions](https://cloud.google.com/iam/docs/reference/rest/v1/permissions/queryTestablePermissions) can accept.
    Lists are also supported for multiple sources.
  - `parent`: Where the role will be created (eg. `organizations/1234567` or `projects/my-project-id`).
  - `include`: specifies which permissions to include from the source (accepts wildcards and regular expressions like `/^storage\./`)
  - `exclude`: specifies which permissions to remove from the source (after inclusion, also accepts wildcards and regular expressions)
  - `append`: Additional permissions to append.
  
See the examples in [config.yaml](config.yaml).

It can be triggered via Pub/Sub (`process_pubsub`) with Cloud Scheduler for example, 
or you can run it from command line. You can also specify the flag `--terraform` to
output Terraform resources for the custom roles (if you prefer a pure Terraform solution,
there is also a Terraform CFT module [custom_role_iam](https://github.com/terraform-google-modules/terraform-google-iam/tree/master/modules/custom_role_iam)
which is slightly less flexible).

Please note that there is an upper limit on role size (64 KB), so sourcing a role
like Editor will result in a too large role unless a lot of permissions are removed.
