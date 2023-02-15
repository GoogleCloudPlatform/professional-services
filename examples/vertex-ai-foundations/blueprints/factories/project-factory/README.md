# Minimal Project Factory

This module implements a minimal, opinionated project factory (see [Factories](../README.md) for rationale) that allows for the creation of projects.

While the module can be invoked by manually populating the required variables, its interface is meant for the massive creation of resources leveraging a set of well-defined YaML documents, as shown in the examples below.

The Project Factory is meant to be executed by a Service Account (or a regular user) having this minimal set of permissions over your resources:

* **Org level** - a custom role for networking operations including the following permissions
  * `"compute.organizations.enableXpnResource"`,
  * `"compute.organizations.disableXpnResource"`,
  * `"compute.subnetworks.setIamPolicy"`,
  * `"dns.networks.bindPrivateDNSZone"`
  * and role `"roles/orgpolicy.policyAdmin"`
* **on each folder** where projects will be created
  * `"roles/logging.admin"`
  * `"roles/owner"`
  * `"roles/resourcemanager.folderAdmin"`
  * `"roles/resourcemanager.projectCreator"`
* **on the host project** for the Shared VPC/s
  * `"roles/browser"`
  * `"roles/compute.viewer"`
  * `"roles/dns.admin"`

## Example

### Directory structure

```
.
├── data
│   ├── defaults.yaml
│   └── projects
│       ├── project-example-one.yaml
│       ├── project-example-two.yaml
│       └── project-example-three.yaml
├── main.tf
└── terraform.tfvars

```

### Terraform code

```hcl
locals {
  defaults = yamldecode(file(local._defaults_file))
  projects = {
    for f in fileset("${local._data_dir}", "**/*.yaml") :
    trimsuffix(f, ".yaml") => yamldecode(file("${local._data_dir}/${f}"))
  }
  # these are usually set via variables
  _base_dir = "./fabric/blueprints/factories/project-factory"
  _data_dir = "${local._base_dir}/sample-data/projects/"
  _defaults_file = "${local._base_dir}/sample-data/defaults.yaml"
}

module "projects" {
  source                 = "./fabric/blueprints/factories/project-factory"
  for_each               = local.projects
  defaults               = local.defaults
  project_id             = each.key
  billing_account_id     = try(each.value.billing_account_id, null)
  billing_alert          = try(each.value.billing_alert, null)
  dns_zones              = try(each.value.dns_zones, [])
  essential_contacts     = try(each.value.essential_contacts, [])
  folder_id              = each.value.folder_id
  group_iam              = try(each.value.group_iam, {})
  iam                    = try(each.value.iam, {})
  kms_service_agents     = try(each.value.kms, {})
  labels                 = try(each.value.labels, {})
  org_policies           = try(each.value.org_policies, {})
  service_accounts       = try(each.value.service_accounts, {})
  services               = try(each.value.services, [])
  service_identities_iam = try(each.value.service_identities_iam, {})
  vpc                    = try(each.value.vpc, null)
}
# tftest modules=7 resources=29
```

### Projects configuration

```yaml
# ./data/defaults.yaml
# The following applies as overrideable defaults for all projects
# All attributes are required

billing_account_id: 012345-67890A-BCDEF0
billing_alert:
  amount: 1000
  thresholds:
    current: [0.5, 0.8]
    forecasted: [0.5, 0.8]
  credit_treatment: INCLUDE_ALL_CREDITS
environment_dns_zone: prod.gcp.example.com
essential_contacts: []
labels:
  environment: production
  department: legal
  application: my-legal-bot
notification_channels: []
shared_vpc_self_link: https://www.googleapis.com/compute/v1/projects/project-example-host-project/global/networks/vpc-one
vpc_host_project: project-example-host-project

```

```yaml
# ./data/projects/project-example-one.yaml
# One file per project - projects will be named after the filename

# [opt] Billing account id - overrides default if set
billing_account_id: 012345-67890A-BCDEF0
                    
# [opt] Billing alerts config - overrides default if set
billing_alert:      
  amount: 10
  thresholds:
    current:
      - 0.5
      - 0.8
    forecasted: []

# [opt] DNS zones to be created as children of the environment_dns_zone defined in defaults 
dns_zones:          
    - lorem
    - ipsum

# [opt] Contacts for billing alerts and important notifications 
essential_contacts:                  
  - team-a-contacts@example.com

# Folder the project will be created as children of
folder_id: folders/012345678901

# [opt] Authoritative IAM bindings in group => [roles] format
group_iam:          
  test-team-foobar@fast-lab-0.gcp-pso-italy.net:
    - roles/compute.admin

# [opt] Authoritative IAM bindings in role => [principals] format
# Generally used to grant roles to service accounts external to the project
iam:                                    
  roles/compute.admin:
    - serviceAccount:service-account

# [opt] Service robots and keys they will be assigned as cryptoKeyEncrypterDecrypter 
# in service => [keys] format
kms_service_agents:                 
  compute: [key1, key2]
  storage: [key1, key2]

# [opt] Labels for the project - merged with the ones defined in defaults
labels:             
  environment: prod

# [opt] Org policy overrides defined at project level
org_policies:
  constraints/compute.disableGuestAttributesAccess: 
    enforce: true
  constraints/compute.trustedImageProjects:
    allow:
      values:
        - projects/fast-dev-iac-core-0
  constraints/compute.vmExternalIpAccess:
    deny:
      all: true

# [opt] Service account to create for the project and their roles on the project
# in name => [roles] format
service_accounts:                      
  another-service-account:
    - roles/compute.admin
  my-service-account:
    - roles/compute.admin

# [opt] IAM bindings on the service account resources.
# in name => {role => [members]} format
service_accounts_iam:
  another-service-account:
    - roles/iam.serviceAccountTokenCreator:
      - group: app-team-1@example.com

# [opt] APIs to enable on the project. 
services:           
  - storage.googleapis.com
  - stackdriver.googleapis.com
  - compute.googleapis.com

# [opt] Roles to assign to the robots service accounts in robot => [roles] format
services_iam:       
  compute:
    - roles/storage.objectViewer

 # [opt] VPC setup. 
 # If set enables the `compute.googleapis.com` service and configures 
 # service project attachment
vpc:               

  # [opt] If set, enables the container API
  gke_setup:        

    # Grants "roles/container.hostServiceAgentUser" to the container robot if set 
    enable_host_service_agent: false

    # Grants  "roles/compute.securityAdmin" to the container robot if set                    
    enable_security_admin: true

  # Host project the project will be service project of                    
  host_project: fast-prod-net-spoke-0

  # [opt] Subnets in the host project where principals will be granted networkUser
  # in region/subnet-name => [principals]                    
  subnets_iam:                          
    europe-west1/prod-default-ew1:
      - user:foobar@example.com
      - serviceAccount:service-account1@my-project.iam.gserviceaccount.com
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [billing_account_id](variables.tf#L17) | Billing account id. | <code>string</code> | ✓ |  |
| [project_id](variables.tf#L157) | Project id. | <code>string</code> | ✓ |  |
| [billing_alert](variables.tf#L22) | Billing alert configuration. | <code title="object&#40;&#123;&#10;  amount &#61; number&#10;  thresholds &#61; object&#40;&#123;&#10;    current    &#61; list&#40;number&#41;&#10;    forecasted &#61; list&#40;number&#41;&#10;  &#125;&#41;&#10;  credit_treatment &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [defaults](variables.tf#L35) | Project factory default values. | <code title="object&#40;&#123;&#10;  billing_account_id &#61; string&#10;  billing_alert &#61; object&#40;&#123;&#10;    amount &#61; number&#10;    thresholds &#61; object&#40;&#123;&#10;      current    &#61; list&#40;number&#41;&#10;      forecasted &#61; list&#40;number&#41;&#10;    &#125;&#41;&#10;    credit_treatment &#61; string&#10;  &#125;&#41;&#10;  environment_dns_zone  &#61; string&#10;  essential_contacts    &#61; list&#40;string&#41;&#10;  labels                &#61; map&#40;string&#41;&#10;  notification_channels &#61; list&#40;string&#41;&#10;  shared_vpc_self_link  &#61; string&#10;  vpc_host_project      &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [dns_zones](variables.tf#L57) | DNS private zones to create as child of var.defaults.environment_dns_zone. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [essential_contacts](variables.tf#L63) | Email contacts to be used for billing and GCP notifications. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [folder_id](variables.tf#L69) | Folder ID for the folder where the project will be created. | <code>string</code> |  | <code>null</code> |
| [group_iam](variables.tf#L75) | Custom IAM settings in group => [role] format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [group_iam_additive](variables.tf#L81) | Custom additive IAM settings in group => [role] format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam](variables.tf#L87) | Custom IAM settings in role => [principal] format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [iam_additive](variables.tf#L93) | Custom additive IAM settings in role => [principal] format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [kms_service_agents](variables.tf#L99) | KMS IAM configuration in as service => [key]. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [labels](variables.tf#L105) | Labels to be assigned at project level. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [org_policies](variables.tf#L111) | Org-policy overrides at project level. | <code title="map&#40;object&#40;&#123;&#10;  inherit_from_parent &#61; optional&#40;bool&#41; &#35; for list policies only.&#10;  reset               &#61; optional&#40;bool&#41;&#10;  allow &#61; optional&#40;object&#40;&#123;&#10;    all    &#61; optional&#40;bool&#41;&#10;    values &#61; optional&#40;list&#40;string&#41;&#41;&#10;  &#125;&#41;&#41;&#10;  deny &#61; optional&#40;object&#40;&#123;&#10;    all    &#61; optional&#40;bool&#41;&#10;    values &#61; optional&#40;list&#40;string&#41;&#41;&#10;  &#125;&#41;&#41;&#10;  enforce &#61; optional&#40;bool, true&#41; &#35; for boolean policies only.&#10;  rules &#61; optional&#40;list&#40;object&#40;&#123;&#10;    allow &#61; optional&#40;object&#40;&#123;&#10;      all    &#61; optional&#40;bool&#41;&#10;      values &#61; optional&#40;list&#40;string&#41;&#41;&#10;    &#125;&#41;&#41;&#10;    deny &#61; optional&#40;object&#40;&#123;&#10;      all    &#61; optional&#40;bool&#41;&#10;      values &#61; optional&#40;list&#40;string&#41;&#41;&#10;    &#125;&#41;&#41;&#10;    enforce &#61; optional&#40;bool, true&#41; &#35; for boolean policies only.&#10;    condition &#61; object&#40;&#123;&#10;      description &#61; optional&#40;string&#41;&#10;      expression  &#61; optional&#40;string&#41;&#10;      location    &#61; optional&#40;string&#41;&#10;      title       &#61; optional&#40;string&#41;&#10;    &#125;&#41;&#10;  &#125;&#41;&#41;, &#91;&#93;&#41;&#10;&#125;&#41;&#41;">map&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [prefix](variables.tf#L151) | Prefix used for the project id. | <code>string</code> |  | <code>null</code> |
| [service_accounts](variables.tf#L162) | Service accounts to be created, and roles assigned them on the project. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [service_accounts_additive](variables.tf#L168) | Service accounts to be created, and roles assigned them on the project additively. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [service_accounts_iam](variables.tf#L174) | IAM bindings on service account resources. Format is KEY => {ROLE => [MEMBERS]} | <code>map&#40;map&#40;list&#40;string&#41;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [service_accounts_iam_additive](variables.tf#L181) | IAM additive bindings on service account resources. Format is KEY => {ROLE => [MEMBERS]} | <code>map&#40;map&#40;list&#40;string&#41;&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [service_identities_iam](variables.tf#L195) | Custom IAM settings for service identities in service => [role] format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [service_identities_iam_additive](variables.tf#L202) | Custom additive IAM settings for service identities in service => [role] format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [services](variables.tf#L188) | Services to be enabled for the project. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [vpc](variables.tf#L209) | VPC configuration for the project. | <code title="object&#40;&#123;&#10;  host_project &#61; string&#10;  gke_setup &#61; object&#40;&#123;&#10;    enable_security_admin     &#61; bool&#10;    enable_host_service_agent &#61; bool&#10;  &#125;&#41;&#10;  subnets_iam &#61; map&#40;list&#40;string&#41;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [project](outputs.tf#L19) | The project resource as return by the `project` module |  |
| [project_id](outputs.tf#L29) | Project ID. |  |

<!-- END TFDOC -->
