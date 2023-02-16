# Network filtering with Squid

This blueprint shows how to deploy a filtering HTTP proxy to restrict Internet access. Here we show one way to do this using a VPC with two subnets:

- The `apps` subnet hosts the VMs that will have their Internet access tightly controlled by a non-caching filtering forward proxy.
- The `proxy` subnet hosts a Cloud NAT instance and a [Squid](http://www.squid-cache.org/) server.

The VPC is a Shared VPC and all the service projects will be located under a folder enforcing the `compute.vmExternalIpAccess` [organization policy](https://cloud.google.com/resource-manager/docs/organization-policy/org-policy-constraints). This prevents the service projects from having external IPs, thus forcing all outbound Internet connections through the proxy.

To allow Internet connectivity to the proxy subnet, a Cloud NAT instance is configured to allow usage from [that subnet only](https://cloud.google.com/nat/docs/using-nat#specify_subnet_ranges_for_nat). All other subnets are not allowed to use the Cloud NAT instance.

To simplify the usage of the proxy, a Cloud DNS private zone is created and the IP address of the proxy is exposed with the FQDN `proxy.internal`.

You can optionally deploy the Squid server as [Managed Instance Group](https://cloud.google.com/compute/docs/instance-groups) by setting the `mig` option to `true`. This option defaults to `false` which results in a standalone VM.

![High-level diagram](squid.png "High-level diagram")
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [billing_account](variables.tf#L26) | Billing account id used as default for new projects. | <code>string</code> | ✓ |  |
| [prefix](variables.tf#L52) | Prefix used for resources that need unique names. | <code>string</code> | ✓ |  |
| [root_node](variables.tf#L63) | Root node for the new hierarchy, either 'organizations/org_id' or 'folders/folder_id'. | <code>string</code> | ✓ |  |
| [allowed_domains](variables.tf#L17) | List of domains allowed by the squid proxy. | <code>list&#40;string&#41;</code> |  | <code title="&#91;&#10;  &#34;.google.com&#34;,&#10;  &#34;.github.com&#34;&#10;&#93;">&#91;&#8230;&#93;</code> |
| [cidrs](variables.tf#L31) | CIDR ranges for subnets. | <code>map&#40;string&#41;</code> |  | <code title="&#123;&#10;  apps  &#61; &#34;10.0.0.0&#47;24&#34;&#10;  proxy &#61; &#34;10.0.1.0&#47;28&#34;&#10;&#125;">&#123;&#8230;&#125;</code> |
| [mig](variables.tf#L40) | Enables the creation of an autoscaling managed instance group of squid instances. | <code>bool</code> |  | <code>false</code> |
| [nat_logging](variables.tf#L46) | Enables Cloud NAT logging if not null, value is one of 'ERRORS_ONLY', 'TRANSLATIONS_ONLY', 'ALL'. | <code>string</code> |  | <code>&#34;ERRORS_ONLY&#34;</code> |
| [region](variables.tf#L57) | Default region for resources. | <code>string</code> |  | <code>&#34;europe-west1&#34;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [squid-address](outputs.tf#L17) | IP address of the Squid proxy. |  |

<!-- END TFDOC -->
