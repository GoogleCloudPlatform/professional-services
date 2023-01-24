# MLOps with Vertex AI - CI/CD environmnet
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [billing_account](variables.tf#L19) | Billing account id and organization id ('nnnnnnnn' or null). | <code title="object&#40;&#123;&#10;  id              &#61; string&#10;  organization_id &#61; number&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> | ✓ |  |
| [prefix](variables.tf#L56) | Prefix used for resources that need unique names. Use 9 characters or less. | <code>string</code> | ✓ |  |
| [data_dir](variables.tf#L28) | Relative path for the folder storing configuration data. | <code>string</code> |  | <code>&#34;data&#47;projects&#34;</code> |
| [defaults_file](variables.tf#L34) | Relative path for the file storing the project factory configuration. | <code>string</code> |  | <code>&#34;data&#47;defaults.yaml&#34;</code> |
| [environment_dns_zone](variables.tf#L40) | DNS zone suffix for environment. | <code>string</code> |  | <code>null</code> |
| [host_project_ids](variables.tf#L47) | Host project for the shared VPC. | <code title="object&#40;&#123;&#10;  dev-spoke-0 &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [vpc_self_links](variables.tf#L67) | Self link for the shared VPC. | <code title="object&#40;&#123;&#10;  dev-spoke-0 &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [projects](outputs.tf#L18) | Created projects and service accounts. |  |

<!-- END TFDOC -->
