# Creating multi-region deployments for API Gateway

This tutorial shows you how to configure an HTTP(S) load balancer to enable multi-region deployments for API Gateway. For more details on how this set up work have a look at the article [here](https://cloud.google.com/api-gateway/docs/multi-region-deployment).

The diagram below depicts the architecture that this blueprint sets up.

![Architecture diagram](diagram.png)

# Running the blueprint

Clone this repository or [open it in cloud shell](https://ssh.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2Fterraform-google-modules%2Fcloud-foundation-fabric&cloudshell_print=cloud-shell-readme.txt&cloudshell_working_dir=blueprints%2Fserverless%2Fapi-gateway), then go through the following steps to create resources:

* `terraform init`
* `terraform apply -var project_id=my-project-id`

## Testing the blueprint

1. Copy the IP address returned as output

2. Execute the following command

        curl -v http://<IP_ADDRESS>/hello

Once done testing, you can clean up resources by running `terraform destroy`.
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [project_id](variables.tf#L26) | Identifier of the project. | <code>string</code> | ✓ |  |
| [regions](variables.tf#L31) | List of regions to deploy the proxy in. | <code>list&#40;string&#41;</code> | ✓ |  |
| [project_create](variables.tf#L17) | Parameters for the creation of the new project. | <code title="object&#40;&#123;&#10;  billing_account_id &#61; string&#10;  parent             &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [ip_address](outputs.tf#L17) | The reserved global IP address. |  |

<!-- END TFDOC -->
