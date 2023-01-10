# Active Directory Federation Services

This blueprint does the following:

Terraform:

- (Optional) Creates a project.
- (Optional) Creates a VPC.
- Sets up managed AD
- Creates a server where AD FS will be installed. This machine will also act as admin workstation for AD.
- Exposes AD FS using GLB.

Ansible:

- Installs the required Windows features and joins the computer to the AD domain.
- Provisions some tests users, groups and group memberships in AD. The data to provision is in the files directory of the ad-provisioning ansible role. There is script available in the scripts/ad-provisioning folder that you can use to generate an alternative users or memberships file.
- Installs AD FS

In addition to this, we also include a Powershell script that facilitates the configuration required for Anthos when authenticating users with AD FS as IdP.

The diagram below depicts the architecture of the blueprint:

![Architecture](architecture.png)

## Running the blueprint

Clone this repository or [open it in cloud shell](https://ssh.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2Fterraform-google-modules%2Fcloud-foundation-fabric&cloudshell_print=cloud-shell-readme.txt&cloudshell_working_dir=blueprints%2Fcloud-operations%2Fadfs), then go through the following steps to create resources:

- `terraform init`
- `terraform apply -var project_id=my-project-id -var ad_dns_domain_name=my-domain.org -var adfs_dns_domain_name=adfs.my-domain.org`

Once the resources have been created, do the following:

1. Create an A record to point the AD FS DNS domain name to the public IP address returned after the terraform configuration was applied.
2. Run the ansible playbook

        ansible-playbook playbook.yaml

# Testing the blueprint

1. In your browser open the following URL:

        https://adfs.my-domain.org/adfs/ls/IdpInitiatedSignOn.aspx

2. Enter the username and password of one of the users provisioned. The username has to be in the format: username@my-domain.org
3. Verify that you have successfully signed in.

Once done testing, you can clean up resources by running `terraform destroy`.
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [ad_dns_domain_name](variables.tf#L44) | AD DNS domain name. | <code>string</code> | ✓ |  |
| [adfs_dns_domain_name](variables.tf#L49) | ADFS DNS domain name. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L24) | Host project ID. | <code>string</code> | ✓ |  |
| [ad_ip_cidr_block](variables.tf#L90) | Managed AD IP CIDR block. | <code>string</code> |  | <code>&#34;10.0.0.0&#47;24&#34;</code> |
| [disk_size](variables.tf#L54) | Disk size. | <code>number</code> |  | <code>50</code> |
| [disk_type](variables.tf#L60) | Disk type. | <code>string</code> |  | <code>&#34;pd-ssd&#34;</code> |
| [image](variables.tf#L66) | Image. | <code>string</code> |  | <code>&#34;projects&#47;windows-cloud&#47;global&#47;images&#47;family&#47;windows-2022&#34;</code> |
| [instance_type](variables.tf#L72) | Instance type. | <code>string</code> |  | <code>&#34;n1-standard-2&#34;</code> |
| [network_config](variables.tf#L35) | Network configuration | <code title="object&#40;&#123;&#10;  network &#61; string&#10;  subnet  &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [prefix](variables.tf#L29) | Prefix for the resources created. | <code>string</code> |  | <code>null</code> |
| [project_create](variables.tf#L15) | Parameters for the creation of the new project. | <code title="object&#40;&#123;&#10;  billing_account_id &#61; string&#10;  parent             &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [region](variables.tf#L78) | Region. | <code>string</code> |  | <code>&#34;europe-west1&#34;</code> |
| [subnet_ip_cidr_block](variables.tf#L96) | Subnet IP CIDR block. | <code>string</code> |  | <code>&#34;10.0.1.0&#47;28&#34;</code> |
| [zone](variables.tf#L84) | Zone. | <code>string</code> |  | <code>&#34;europe-west1-c&#34;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [ip_address](outputs.tf#L15) | IP address. |  |

<!-- END TFDOC -->
