# M4CE(v5) - Single Project

This blueprint creates a simple M4CE (v5) environment deployed on a single [host project](https://cloud.google.com/migrate/compute-engine/docs/5.0/how-to/enable-services#identifying_your_host_project).

The blueprint is designed for quick tests or product demos where it is required to setup a simple and minimal M4CE (v5) environment. It also includes the IAM wiring needed to make such scenarios work.

This is the high level diagram:

![High-level diagram](diagram.png "High-level diagram")

## Managed resources and services

This sample creates several distinct groups of resources:

- projects
  - M4CE host project with [required services](https://cloud.google.com/migrate/compute-engine/docs/5.0/how-to/enable-services#enabling_required_services_on_the_host_project) deployed on a new or existing project. 
- networking
  - Default VPC network
- IAM
  - One [service account](https://cloud.google.com/migrate/compute-engine/docs/5.0/how-to/migrate-connector#step-3) used at runtime by the M4CE connector for data replication
  - Grant [migration admin roles](https://cloud.google.com/migrate/compute-engine/docs/5.0/how-to/enable-services#using_predefined_roles) to admin user accounts
  - Grant [migration viewer role](https://cloud.google.com/migrate/compute-engine/docs/5.0/how-to/enable-services#using_predefined_roles) to viewer user accounts
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [migration_admin_users](variables.tf#L15) | List of users authorized to create a new M4CE sources and perform all other migration operations, in IAM format | <code>list&#40;string&#41;</code> | ✓ |  |
| [migration_viewer_users](variables.tf#L20) | List of users authorized to retrive information about M4CE in the Google Cloud Console, in IAM format | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [project_create](variables.tf#L26) | Parameters for the creation of the new project to host the M4CE backend | <code title="object&#40;&#123;&#10;  billing_account_id &#61; string&#10;  parent             &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [project_name](variables.tf#L35) | Name of an existing project or of the new project assigned as M4CE host an target project | <code>string</code> |  | <code>&#34;m4ce-host-project-000&#34;</code> |
| [vpc_config](variables.tf#L41) | Parameters to create a simple VPC on the M4CE project | <code title="object&#40;&#123;&#10;  ip_cidr_range &#61; string,&#10;  region        &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  ip_cidr_range &#61; &#34;10.200.0.0&#47;20&#34;,&#10;  region        &#61; &#34;us-west2&#34;&#10;&#125;">&#123;&#8230;&#125;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [m4ce_gmanaged_service_account](outputs.tf#L15) | Google managed service account created automatically during the migrate connector registration. It is used by M4CE to perform activities on target projects |  |

<!-- END TFDOC -->
