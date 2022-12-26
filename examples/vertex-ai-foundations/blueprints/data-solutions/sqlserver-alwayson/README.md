## SQL Server Always On Groups blueprint

This is an blueprint of building [SQL Server Always On Availability Groups](https://cloud.google.com/compute/docs/instances/sql-server/configure-availability) 
using Fabric modules. It builds a two node cluster with a fileshare witness instance in an existing VPC and adds the necessary firewalling. 

![Architecture diagram](https://cloud.google.com/compute/images/sqlserver-ag-architecture.svg)

The actual setup process (apart from Active Directory operations) has been scripted, so that least amount of 
manual works needs to performed: 

  - Joining the domain using appropriate credentials 
  - Running an automatically generated initialization script (`C:\InitializeCluster.ps1`) 
  - Creating the [Availability Groups using the wizard](https://cloud.google.com/compute/docs/instances/sql-server/configure-availability#creating_an_availability_group)
    (please note that healthchecks are automatically configured when the appropriate AGs are created)

To monitor the installation process, the startup scripts log output to Application Log (visible under Windows Logs in Event Viewer)
and to `C:\GcpSetupLog.txt` file.

<!-- TFDOC OPTS files:1 -->
<!-- BEGIN TFDOC -->

## Files

| name | description | modules |
|---|---|---|
| [instances.tf](./instances.tf) | Creates SQL Server instances and witness. | <code>compute-vm</code> |
| [main.tf](./main.tf) | Module-level locals and resources. | <code>project</code> |
| [outputs.tf](./outputs.tf) | Module outputs. |  |
| [secrets.tf](./secrets.tf) | Creates SQL admin user password secret. | <code>secret-manager</code> |
| [service-accounts.tf](./service-accounts.tf) | Creates service accounts for the instances. | <code>iam-service-account</code> |
| [variables.tf](./variables.tf) | Module variables. |  |
| [vpc.tf](./vpc.tf) | Creates the VPC and manages the firewall rules and ILB. | <code>net-address</code> · <code>net-ilb</code> · <code>net-vpc</code> · <code>net-vpc-firewall</code> |

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [ad_domain_fqdn](variables.tf#L111) | Active Directory domain (FQDN) | <code>string</code> | ✓ |  |
| [ad_domain_netbios](variables.tf#L120) | Active Directory domain (NetBIOS) | <code>string</code> | ✓ |  |
| [network](variables.tf#L38) | Network to use in the project | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L27) | Google Cloud project ID | <code>string</code> | ✓ |  |
| [sql_admin_password](variables.tf#L102) | Password for the SQL admin user to be created | <code>string</code> | ✓ |  |
| [subnetwork](variables.tf#L43) | Subnetwork to use in the project | <code>string</code> | ✓ |  |
| [always_on_groups](variables.tf#L135) | List of Always On Groups | <code>list&#40;string&#41;</code> |  | <code>&#91;&#34;bookshelf&#34;&#93;</code> |
| [boot_disk_size](variables.tf#L90) | Boot disk size in GB | <code>number</code> |  | <code>50</code> |
| [cluster_name](variables.tf#L48) | Cluster name (prepended with prefix) | <code>string</code> |  | <code>&#34;cluster&#34;</code> |
| [data_disk_size](variables.tf#L96) | Database disk size in GB | <code>number</code> |  | <code>200</code> |
| [health_check_config](variables.tf#L147) | Health check configuration | <code title="object&#40;&#123; check_interval_sec &#61; number,&#10;  healthy_threshold   &#61; number,&#10;  unhealthy_threshold &#61; number,&#10;  timeout_sec         &#61; number,&#10;&#125;&#41;">&#8230;</code> |  | <code title="&#123;&#10;  check_interval_sec  &#61; 2&#10;  healthy_threshold   &#61; 1&#10;  unhealthy_threshold &#61; 2&#10;  timeout_sec         &#61; 1&#10;&#125;">&#123;&#8230;&#125;</code> |
| [health_check_port](variables.tf#L141) | Health check port | <code>number</code> |  | <code>59997</code> |
| [health_check_ranges](variables.tf#L60) | Health check ranges | <code>list&#40;string&#41;</code> |  | <code>&#91;&#34;35.191.0.0&#47;16&#34;, &#34;209.85.152.0&#47;22&#34;, &#34;209.85.204.0&#47;22&#34;&#93;</code> |
| [managed_ad_dn](variables.tf#L129) | Managed Active Directory domain (eg. OU=Cloud,DC=example,DC=com) | <code>string</code> |  | <code>&#34;&#34;</code> |
| [node_image](variables.tf#L78) | SQL Server node machine image | <code>string</code> |  | <code>&#34;projects&#47;windows-sql-cloud&#47;global&#47;images&#47;family&#47;sql-ent-2019-win-2019&#34;</code> |
| [node_instance_type](variables.tf#L66) | SQL Server database node instance type | <code>string</code> |  | <code>&#34;n2-standard-8&#34;</code> |
| [node_name](variables.tf#L162) | Node base name | <code>string</code> |  | <code>&#34;node&#34;</code> |
| [prefix](variables.tf#L15) | Prefix used for resources (for multiple clusters in a project) | <code>string</code> |  | <code>&#34;aog&#34;</code> |
| [project_create](variables.tf#L174) | Provide values if project creation is needed, uses existing project if null. Parent is in 'folders/nnn' or 'organizations/nnn' format. | <code title="object&#40;&#123;&#10;  billing_account_id &#61; string&#10;  parent             &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [region](variables.tf#L21) | Region for resources | <code>string</code> |  | <code>&#34;europe-west4&#34;</code> |
| [shared_vpc_project_id](variables.tf#L32) | Shared VPC project ID for firewall rules | <code>string</code> |  | <code>null</code> |
| [sql_client_cidrs](variables.tf#L54) | CIDR ranges that are allowed to connect to SQL Server | <code>list&#40;string&#41;</code> |  | <code>&#91;&#34;0.0.0.0&#47;0&#34;&#93;</code> |
| [vpc_ip_cidr_range](variables.tf#L183) | Ip range used in the subnet deployef in the Service Project. | <code>string</code> |  | <code>&#34;10.0.0.0&#47;20&#34;</code> |
| [witness_image](variables.tf#L84) | SQL Server witness machine image | <code>string</code> |  | <code>&#34;projects&#47;windows-cloud&#47;global&#47;images&#47;family&#47;windows-2019&#34;</code> |
| [witness_instance_type](variables.tf#L72) | SQL Server witness node instance type | <code>string</code> |  | <code>&#34;n2-standard-2&#34;</code> |
| [witness_name](variables.tf#L168) | Witness base name | <code>string</code> |  | <code>&#34;witness&#34;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [instructions](outputs.tf#L19) |  |  |

<!-- END TFDOC -->
