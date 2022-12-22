# M4CE(v5) - ESXi Connector

This blueprint deploys a virtual machine from an OVA image and the security prerequisites to run the Migrate for Compute Engine (v5) [connector](https://cloud.google.com/migrate/compute-engine/docs/5.0/how-to/migrate-connector) on VMWare ESXi.

The blueprint is designed to deploy the M4CE (v5) connector on and existing VMWare environment. The [network configuration](https://cloud.google.com/migrate/compute-engine/docs/5.0/concepts/architecture#migration_architecture) required to allow the communication of the migrate connector to the GCP API is not included in this blueprint.

This is the high level diagram:

![High-level diagram](diagram.png "High-level diagram")

## Managed resources and services

This sample creates several distinct groups of resources:

- virtual machine
  - [M4CE migrate connector](https://cloud.google.com/migrate/compute-engine/docs/5.0/how-to/migrate-connector#installing_the_migrate_connector) 
- IAM
  - [vCenter user role](https://cloud.google.com/migrate/compute-engine/docs/5.0/how-to/migrate-connector#step-1)
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [m4ce_ssh_public_key](variables.tf#L43) | Filesystem path to the public key for the SSH login | <code>string</code> | ✓ |  |
| [vcenter_password](variables.tf#L48) | VCenter user password. | <code>string</code> | ✓ |  |
| [vsphere_environment](variables.tf#L53) | VMVware VSphere connection parameters | <code title="object&#40;&#123;&#10;  vcenter_ip    &#61; string&#10;  vcenter_user  &#61; string&#10;  data_center   &#61; string&#10;  resource_pool &#61; string&#10;  host_ip       &#61; string&#10;  datastore     &#61; string&#10;  virtual_net   &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> | ✓ |  |
| [m4ce_appliance_properties](variables.tf#L15) | M4CE connector OVA image configuration parameters | <code title="object&#40;&#123;&#10;  hostname &#61; string&#10;  ip0      &#61; string&#10;  netmask0 &#61; string&#10;  gateway  &#61; string&#10;  DNS      &#61; string&#10;  proxy    &#61; string&#10;  route0   &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  &#34;hostname&#34; &#61; &#34;gcp-m4ce-connector&#34;&#10;  &#34;ip0&#34;      &#61; &#34;0.0.0.0&#34;&#10;  &#34;netmask0&#34; &#61; &#34;0.0.0.0&#34;&#10;  &#34;gateway&#34;  &#61; &#34;0.0.0.0&#34;&#10;  &#34;DNS&#34;      &#61; &#34;&#34;&#10;  &#34;proxy&#34;    &#61; &#34;&#34;&#10;  &#34;route0&#34;   &#61; &#34;&#34;&#10;&#125;">&#123;&#8230;&#125;</code> |
| [m4ce_connector_ovf_url](variables.tf#L37) | http URL to the public M4CE connector OVA image | <code>string</code> |  | <code>&#34;https:&#47;&#47;storage.googleapis.com&#47;vmmigration-public-artifacts&#47;migrate-connector-2-0-1663.ova&#34;</code> |

<!-- END TFDOC -->
## Manual Steps
Once this blueprint is deployed a VCenter user has to be created and binded to the M4CE role in order to allow the connector access the VMWare resources.
The user can be created manually through the VCenter web interface or through GOV commandline if it is available:
```bash
export GOVC_URL=<VCENTER_URL> (eg. https://192.168.1.100/sdk)
export GOVC_USERNAME=<VCENTER_ADMIN_USER> (eg. administrator@example.local)
export GOVC_PASSWORD=<PASSWORD>
export GOVC_INSECURE=true

govc sso.user.create  -p <USER_PASSWORD> -R gcp-m4ce-role gcp-m4ce-user
govc permissions.set  -principal gcp-m4ce-user@example.local   -propagate=true  -role gcp-m4ce-role
```
