# M4CE(v5) - Host and Target Projects

This blueprint creates a Migrate for Compute Engine (v5) environment deployed on an host project with multiple  [target projects](https://cloud.google.com/migrate/compute-engine/docs/5.0/how-to/enable-services#identifying_your_host_project).

The blueprint is designed to implement a M4CE (v5) environment on-top of complex migration landing environments where VMs have to be migrated to multiple target projects. It also includes the IAM wiring needed to make such scenarios work.

This is the high level diagram:

![High-level diagram](diagram.png "High-level diagram")

## Managed resources and services

This sample creates\updates several distinct groups of resources:

- projects
  - Deploy M4CE host project with [required services](https://cloud.google.com/migrate/compute-engine/docs/5.0/how-to/enable-services#enabling_required_services_on_the_host_project) on a new or existing project. 
  - M4CE target project prerequisites deployed on existing projects. 
- IAM
  - Create a [service account](https://cloud.google.com/migrate/compute-engine/docs/5.0/how-to/migrate-connector#step-3) used at runtime by the M4CE connector for data replication
  - Grant [migration admin roles](https://cloud.google.com/migrate/compute-engine/docs/5.0/how-to/enable-services#using_predefined_roles) to provided user accounts
  - Grant [migration viewer role](https://cloud.google.com/migrate/compute-engine/docs/5.0/how-to/enable-services#using_predefined_roles) to provided user accounts
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [migration_admin_users](variables.tf#L15) | List of users authorized to create a new M4CE sources and perform all other migration operations, in IAM format | <code>list&#40;string&#41;</code> | ✓ |  |
| [migration_target_projects](variables.tf#L20) | List of target projects for m4ce workload migrations | <code>list&#40;string&#41;</code> | ✓ |  |
| [migration_viewer_users](variables.tf#L25) | List of users authorized to retrive information about M4CE in the Google Cloud Console, in IAM format | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [project_create](variables.tf#L31) | Parameters for the creation of the new project to host the M4CE backend | <code title="object&#40;&#123;&#10;  billing_account_id &#61; string&#10;  parent             &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [project_name](variables.tf#L40) | Name of an existing project or of the new project assigned as M4CE host project | <code>string</code> |  | <code>&#34;m4ce-host-project-000&#34;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [m4ce_gmanaged_service_account](outputs.tf#L15) | Google managed service account created automatically during the migrate connector registration.. It is used by M4CE to perform activities on target projects |  |

<!-- END TFDOC -->
