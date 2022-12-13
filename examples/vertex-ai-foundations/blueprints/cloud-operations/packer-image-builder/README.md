# Compute Image builder with Hashicorp Packer

This blueprint shows how to deploy infrastructure for a Compute Engine image builder based on
[Hashicorp's Packer tool](https://www.packer.io).

![High-level diagram](diagram.png "High-level diagram")

## Running the blueprint

Prerequisite: [Packer](https://www.packer.io/downloads) version >= v1.7.0

Infrastructure setup (Terraform part):

1. Set Terraform configuration variables
2. Run `terraform init`
3. Run `terraform apply`

Building Compute Engine image (Packer part):

1. Enter `packer` directory
2. Set Packer configuration variables (see [Configuring Packer](#configuring-packer) below)
3. Run `packer init .`
4. Run `packer build .`

## Using Packer's service account

The following blueprint leverages [service account impersonation](https://cloud.google.com/iam/docs/impersonating-service-accounts)
to execute any operations on GCP as a dedicated Packer service account. Depending on how you execute
the Packer tool, you need to grant your principal rights to impersonate Packer's service account.

Set `packer_account_users` variable in Terraform configuration to grant roles required to impersonate
Packer's service account to selected IAM principals.
Blueprint: allow default [Cloud Build](https://cloud.google.com/build) service account to impersonate
Packer SA: `packer_account_users=["serviceAccount:myProjectNumber@cloudbuild.gserviceaccount.com"]`.

## Configuring Packer

Provided Packer build blueprint uses [HCL2 configuration files](https://www.packer.io/guides/hcl) and
requires configuration of some input variables *(i.e. service accounts emails)*.
Values of those variables can be taken from the Terraform outputs.

For your convenience, Terraform can populate Packer's variable file.
You can enable this behavior by setting `create_packer_vars` configuration variable to `true`.
Terraform will use template from `packer/build.pkrvars.tpl` file and generate `packer/build.auto.pkrvars.hcl`
variable file for Packer.

Read [Assigning Variables](https://www.packer.io/guides/hcl/variables#assigning-variables) chapter
from [Packer's documentation](https://www.packer.io/docs) for more details on setting up Packer variables.

## Accessing temporary VM

Packer creates a temporary Compute Engine VM instance for provisioning. As we recommend using internal
IP addresses only, communication with this VM has to either:

* originate from the network routable on Packer's VPC *(i.e. peered VPC, over VPN or interconnect)*
* use [Identity-Aware Proxy](https://cloud.google.com/iap/docs/using-tcp-forwarding) tunnel

By default, this blueprint assumes that IAP tunnel is needed to communicate with the temporary VM.
This might be changed by setting `use_iap` variable to `false` in Terraform and Packer
configurations respectively.

**NOTE:** using IAP tunnel with Packer requires gcloud SDK installed on the system running Packer.

## Accessing resources over the Internet

The blueprint assumes that provisioning of a Compute Engine VM requires access to
the resources over the Internet (i.e. to install OS packages). Since Compute VM has no public IP
address for security reasons, Internet connectivity is done with [Cloud NAT](https://cloud.google.com/nat/docs/overview).
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [project_id](variables.tf#L55) | Project id that references existing project. | <code>string</code> | ✓ |  |
| [billing_account](variables.tf#L17) | Billing account id used as default for new projects. | <code>string</code> |  | <code>null</code> |
| [cidrs](variables.tf#L23) | CIDR ranges for subnets. | <code>map&#40;string&#41;</code> |  | <code title="&#123;&#10;  image-builder &#61; &#34;10.0.0.0&#47;24&#34;&#10;&#125;">&#123;&#8230;&#125;</code> |
| [create_packer_vars](variables.tf#L31) | Create packer variables file using template file and terraform output. | <code>bool</code> |  | <code>false</code> |
| [packer_account_users](variables.tf#L37) | List of members that will be allowed to impersonate Packer image builder service account in IAM format, i.e. 'user:{emailid}'. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [packer_source_cidrs](variables.tf#L43) | List of CIDR ranges allowed to connect to the temporary VM for provisioning. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#34;0.0.0.0&#47;0&#34;&#93;</code> |
| [project_create](variables.tf#L49) | Create project instead of using an existing one. | <code>bool</code> |  | <code>true</code> |
| [region](variables.tf#L60) | Default region for resources. | <code>string</code> |  | <code>&#34;europe-west1&#34;</code> |
| [root_node](variables.tf#L66) | The resource name of the parent folder or organization for project creation, in 'folders/folder_id' or 'organizations/org_id' format. | <code>string</code> |  | <code>null</code> |
| [use_iap](variables.tf#L72) | Use IAP tunnel to connect to Compute Engine instance for provisioning. | <code>bool</code> |  | <code>true</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [builder_sa](outputs.tf#L17) | Packer's service account email. |  |
| [compute_sa](outputs.tf#L22) | Packer's temporary VM service account email. |  |
| [compute_subnetwork](outputs.tf#L27) | Name of a subnetwork for Packer's temporary VM. |  |
| [compute_zone](outputs.tf#L32) | Name of a compute engine zone for Packer's temporary VM. |  |

<!-- END TFDOC -->
