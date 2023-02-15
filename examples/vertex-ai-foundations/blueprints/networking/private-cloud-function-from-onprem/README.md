# Calling a private Cloud Function from On-premises

This example shows how to invoke a private Google Cloud Function from the on-prem environment via a Private Service Connect endpoint.

According to the [documentation](https://cloud.google.com/functions/docs/networking/network-settings#ingress_settings), only requests from VPC networks in the same project or VPC Service Controls perimeter are allowed to call a private Cloud Function. That's the reason why a Private Service Connect endpoint is needed in this architecture.

The Terraform script in this folder will create two projects connected via VPN: one to simulate the on-prem environment and another containing the Cloud Function and the Private Service Connect endpoint.

The "on-prem" project contains a small VM that can be used to test the accessibility to the private Cloud Function:

```bash
curl https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/YOUR_FUNCTION_NAME
```

![Cloud Function via Private Service Connect](diagram.png "High-level diagram")
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [project_id](variables.tf#L44) | Project id. | <code>string</code> | ✓ |  |
| [ip_ranges](variables.tf#L17) | IP ranges used for the VPCs. | <code title="object&#40;&#123;&#10;  onprem &#61; string&#10;  hub    &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  onprem &#61; &#34;10.0.1.0&#47;24&#34;,&#10;  hub    &#61; &#34;10.0.2.0&#47;24&#34;&#10;&#125;">&#123;&#8230;&#125;</code> |
| [name](variables.tf#L29) | Name used for new resources. | <code>string</code> |  | <code>&#34;cf-via-psc&#34;</code> |
| [project_create](variables.tf#L35) | If non null, creates project instead of using an existing one. | <code title="object&#40;&#123;&#10;  billing_account_id &#61; string&#10;  parent             &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [psc_endpoint](variables.tf#L49) | IP used for the Private Service Connect endpoint, it must not overlap with the hub_ip_range. | <code>string</code> |  | <code>&#34;172.16.32.1&#34;</code> |
| [region](variables.tf#L55) | Region where the resources will be created. | <code>string</code> |  | <code>&#34;europe-west1&#34;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [function_url](outputs.tf#L17) | URL of the Cloud Function. |  |

<!-- END TFDOC -->
