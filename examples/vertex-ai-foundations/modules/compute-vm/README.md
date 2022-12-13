# Google Compute Engine VM module

This module can operate in two distinct modes:

- instance creation, with optional unmanaged group
- instance template creation

In both modes, an optional service account can be created and assigned to either instances or template. If you need a managed instance group when using the module in template mode, refer to the [`compute-mig`](../compute-mig) module.

## Examples

### Instance using defaults

The simplest example leverages defaults for the boot disk image and size, and uses a service account created by the module. Multiple instances can be managed via the `instance_count` variable.

```hcl
module "simple-vm-example" {
  source     = "./fabric/modules/compute-vm"
  project_id = var.project_id
  zone     = "europe-west1-b"
  name       = "test"
  network_interfaces = [{
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
  }]
  service_account_create = true
}
# tftest modules=1 resources=2

```

### Spot VM

[Spot VMs](https://cloud.google.com/compute/docs/instances/spot) are ephemeral compute instances suitable for batch jobs and fault-tolerant workloads. Spot VMs provide new features that [preemptible instances](https://cloud.google.com/compute/docs/instances/preemptible) do not support, such as the absence of a maximum runtime.

```hcl
module "spot-vm-example" {
  source     = "./fabric/modules/compute-vm"
  project_id = var.project_id
  zone     = "europe-west1-b"
  name       = "test"
  options = {
    spot                      = true
    termination_action = "STOP"    
  }
  network_interfaces = [{
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
  }]
  service_account_create = true
}
# tftest modules=1 resources=2

```

### Disk sources

Attached disks can be created and optionally initialized from a pre-existing source, or attached to VMs when pre-existing. The `source` and `source_type` attributes of the `attached_disks` variable allows several modes of operation:

- `source_type = "image"` can be used with zonal disks in instances and templates, set `source` to the image name or link
- `source_type = "snapshot"` can be used with instances only, set `source` to the snapshot name or link
- `source_type = "attach"` can be used for both instances and templates to attach an existing disk, set source to the name (for zonal disks) or link (for regional disks) of the existing disk to attach; no disk will be created
- `source_type = null` can be used where an empty disk is needed, `source` becomes irrelevant and can be left null

This is an example of attaching a pre-existing regional PD to a new instance:

```hcl
module "simple-vm-example" {
  source     = "./fabric/modules/compute-vm"
  project_id = var.project_id
  zone     = "${var.region}-b"
  name       = "test"
  network_interfaces = [{
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
  }]
  attached_disks = [{
    name        = "repd-1"
    size        = 10
    source_type = "attach"
    source      = "regions/${var.region}/disks/repd-test-1"
    options = {
      replica_zone = "${var.region}-c"
    }
  }]
  service_account_create = true
}
# tftest modules=1 resources=2
```

And the same example for an instance template (where not using the full self link of the disk triggers recreation of the template)

```hcl
module "simple-vm-example" {
  source     = "./fabric/modules/compute-vm"
  project_id = var.project_id
  zone     = "${var.region}-b"
  name       = "test"
  network_interfaces = [{
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
  }]
  attached_disks = [{
    name        = "repd"
    size        = 10
    source_type = "attach"
    source      = "https://www.googleapis.com/compute/v1/projects/${var.project_id}/regions/${var.region}/disks/repd-test-1"
    options = {
      replica_zone = "${var.region}-c"
    }
  }]
  service_account_create = true
  create_template  = true
}
# tftest modules=1 resources=2
```

### Disk encryption with Cloud KMS

This example shows how to control disk encryption via the the `encryption` variable, in this case the self link to a KMS CryptoKey that will be used to encrypt boot and attached disk. Managing the key with the `../kms` module is of course possible, but is not shown here.

```hcl
module "kms-vm-example" {
  source     = "./fabric/modules/compute-vm"
  project_id = var.project_id
  zone       = "europe-west1-b"
  name       = "kms-test"
  network_interfaces = [{
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
  }]
  attached_disks = [
    {
      name  = "attached-disk"
      size  = 10
    }
  ]
  service_account_create = true
  boot_disk = {
    image        = "projects/debian-cloud/global/images/family/debian-10"
  }
  encryption = {
    encrypt_boot            = true
    kms_key_self_link       = var.kms_key.self_link
  }
}
# tftest modules=1 resources=3
```

### Using Alias IPs

This example shows how to add additional [Alias IPs](https://cloud.google.com/vpc/docs/alias-ip) to your VM.

```hcl
module "vm-with-alias-ips" {
  source     = "./fabric/modules/compute-vm"
  project_id = "my-project"
  zone       = "europe-west1-b"
  name       = "test"
  network_interfaces = [{
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
    alias_ips = {
      alias1 = "10.16.0.10/32"
    }
  }]
  service_account_create = true
}
# tftest modules=1 resources=2
```

### Using gVNIC

This example shows how to enable [gVNIC](https://cloud.google.com/compute/docs/networking/using-gvnic) on your VM by customizing a `cos` image. Given that gVNIC needs to be enabled as an instance configuration and as a guest os configuration, you'll need to supply a bootable disk with `guest_os_features=GVNIC`. `SEV_CAPABLE`, `UEFI_COMPATIBLE` and `VIRTIO_SCSI_MULTIQUEUE` are enabled implicitly in the `cos`, `rhel`, `centos` and other images.

```hcl

resource "google_compute_image" "cos-gvnic" {
  project       = "my-project"
  name          = "my-image"
  source_image  = "https://www.googleapis.com/compute/v1/projects/cos-cloud/global/images/cos-89-16108-534-18"

  guest_os_features {
    type = "GVNIC"
  }
  guest_os_features {
    type = "SEV_CAPABLE"
  }
  guest_os_features {
    type = "UEFI_COMPATIBLE"
  }
  guest_os_features {
    type = "VIRTIO_SCSI_MULTIQUEUE"
  }
}

module "vm-with-gvnic" {
  source     = "./fabric/modules/compute-vm"
  project_id = "my-project"
  zone       = "europe-west1-b"
  name       = "test"
  boot_disk      = {
      image = google_compute_image.cos-gvnic.self_link
      type  = "pd-ssd"
  }
  network_interfaces = [{
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
    nic_type   = "GVNIC"
  }]
  service_account_create = true
}
# tftest modules=1 resources=3
```

### Instance template

This example shows how to use the module to manage an instance template that defines an additional attached disk for each instance, and overrides defaults for the boot disk image and service account.

```hcl
module "cos-test" {
  source     = "./fabric/modules/compute-vm"
  project_id = "my-project"
  zone     = "europe-west1-b"
  name       = "test"
  network_interfaces = [{
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
  }]
  boot_disk      = {
    image = "projects/cos-cloud/global/images/family/cos-stable"
  }
  attached_disks = [
    {
      name        = "disk-1"
      size        = 10
    }
  ]
  service_account        = "vm-default@my-project.iam.gserviceaccount.com"
  create_template  = true
}
# tftest modules=1 resources=1
```

### Instance group

If an instance group is needed when operating in instance mode, simply set the `group` variable to a non null map. The map can contain named port declarations, or be empty if named ports are not needed.

```hcl
locals {
  cloud_config = "my cloud config"
}

module "instance-group" {
  source     = "./fabric/modules/compute-vm"
  project_id = "my-project"
  zone     = "europe-west1-b"
  name       = "ilb-test"
  network_interfaces = [{
    network    = var.vpc.self_link
    subnetwork = var.subnet.self_link
  }]
  boot_disk = {
    image = "projects/cos-cloud/global/images/family/cos-stable"
  }
  service_account        = var.service_account.email
  service_account_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  metadata = {
    user-data = local.cloud_config
  }
  group = { named_ports = {} }
}
# tftest modules=1 resources=2
```
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [name](variables.tf#L180) | Instance name. | <code>string</code> | ✓ |  |
| [network_interfaces](variables.tf#L185) | Network interfaces configuration. Use self links for Shared VPC, set addresses to null if not needed. | <code title="list&#40;object&#40;&#123;&#10;  nat        &#61; optional&#40;bool, false&#41;&#10;  network    &#61; string&#10;  subnetwork &#61; string&#10;  addresses &#61; optional&#40;object&#40;&#123;&#10;    internal &#61; string&#10;    external &#61; string&#10;  &#125;&#41;, null&#41;&#10;  alias_ips &#61; optional&#40;map&#40;string&#41;, &#123;&#125;&#41;&#10;  nic_type  &#61; optional&#40;string&#41;&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> | ✓ |  |
| [project_id](variables.tf#L222) | Project id. | <code>string</code> | ✓ |  |
| [zone](variables.tf#L281) | Compute zone. | <code>string</code> | ✓ |  |
| [attached_disk_defaults](variables.tf#L17) | Defaults for attached disks options. | <code title="object&#40;&#123;&#10;  auto_delete  &#61; optional&#40;bool, false&#41;&#10;  mode         &#61; string&#10;  replica_zone &#61; string&#10;  type         &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  auto_delete  &#61; true&#10;  mode         &#61; &#34;READ_WRITE&#34;&#10;  replica_zone &#61; null&#10;  type         &#61; &#34;pd-balanced&#34;&#10;&#125;">&#123;&#8230;&#125;</code> |
| [attached_disks](variables.tf#L38) | Additional disks, if options is null defaults will be used in its place. Source type is one of 'image' (zonal disks in vms and template), 'snapshot' (vm), 'existing', and null. | <code title="list&#40;object&#40;&#123;&#10;  name        &#61; string&#10;  size        &#61; string&#10;  source      &#61; optional&#40;string&#41;&#10;  source_type &#61; optional&#40;string&#41;&#10;  options &#61; optional&#40;&#10;    object&#40;&#123;&#10;      auto_delete  &#61; optional&#40;bool, false&#41;&#10;      mode         &#61; optional&#40;string, &#34;READ_WRITE&#34;&#41;&#10;      replica_zone &#61; optional&#40;string&#41;&#10;      type         &#61; optional&#40;string, &#34;pd-balanced&#34;&#41;&#10;    &#125;&#41;,&#10;    &#123;&#10;      auto_delete  &#61; true&#10;      mode         &#61; &#34;READ_WRITE&#34;&#10;      replica_zone &#61; null&#10;      type         &#61; &#34;pd-balanced&#34;&#10;    &#125;&#10;  &#41;&#10;&#125;&#41;&#41;">list&#40;object&#40;&#123;&#8230;&#125;&#41;&#41;</code> |  | <code>&#91;&#93;</code> |
| [boot_disk](variables.tf#L81) | Boot disk properties. | <code title="object&#40;&#123;&#10;  auto_delete &#61; optional&#40;bool, true&#41;&#10;  image       &#61; optional&#40;string, &#34;projects&#47;debian-cloud&#47;global&#47;images&#47;family&#47;debian-11&#34;&#41;&#10;  size        &#61; optional&#40;number, 10&#41;&#10;  type        &#61; optional&#40;string, &#34;pd-balanced&#34;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  auto_delete &#61; true&#10;  image       &#61; &#34;projects&#47;debian-cloud&#47;global&#47;images&#47;family&#47;debian-11&#34;&#10;  type        &#61; &#34;pd-balanced&#34;&#10;  size        &#61; 10&#10;&#125;">&#123;&#8230;&#125;</code> |
| [can_ip_forward](variables.tf#L97) | Enable IP forwarding. | <code>bool</code> |  | <code>false</code> |
| [confidential_compute](variables.tf#L103) | Enable Confidential Compute for these instances. | <code>bool</code> |  | <code>false</code> |
| [create_template](variables.tf#L109) | Create instance template instead of instances. | <code>bool</code> |  | <code>false</code> |
| [description](variables.tf#L114) | Description of a Compute Instance. | <code>string</code> |  | <code>&#34;Managed by the compute-vm Terraform module.&#34;</code> |
| [enable_display](variables.tf#L120) | Enable virtual display on the instances. | <code>bool</code> |  | <code>false</code> |
| [encryption](variables.tf#L126) | Encryption options. Only one of kms_key_self_link and disk_encryption_key_raw may be set. If needed, you can specify to encrypt or not the boot disk. | <code title="object&#40;&#123;&#10;  encrypt_boot            &#61; optional&#40;bool, false&#41;&#10;  disk_encryption_key_raw &#61; optional&#40;string&#41;&#10;  kms_key_self_link       &#61; optional&#40;string&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [group](variables.tf#L136) | Define this variable to create an instance group for instances. Disabled for template use. | <code title="object&#40;&#123;&#10;  named_ports &#61; map&#40;number&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [hostname](variables.tf#L144) | Instance FQDN name. | <code>string</code> |  | <code>null</code> |
| [iam](variables.tf#L150) | IAM bindings in {ROLE => [MEMBERS]} format. | <code>map&#40;list&#40;string&#41;&#41;</code> |  | <code>&#123;&#125;</code> |
| [instance_type](variables.tf#L156) | Instance type. | <code>string</code> |  | <code>&#34;f1-micro&#34;</code> |
| [labels](variables.tf#L162) | Instance labels. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [metadata](variables.tf#L168) | Instance metadata. | <code>map&#40;string&#41;</code> |  | <code>&#123;&#125;</code> |
| [min_cpu_platform](variables.tf#L174) | Minimum CPU platform. | <code>string</code> |  | <code>null</code> |
| [options](variables.tf#L200) | Instance options. | <code title="object&#40;&#123;&#10;  allow_stopping_for_update &#61; optional&#40;bool, true&#41;&#10;  deletion_protection       &#61; optional&#40;bool, false&#41;&#10;  spot                      &#61; optional&#40;bool, false&#41;&#10;  termination_action        &#61; optional&#40;string&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  allow_stopping_for_update &#61; true&#10;  deletion_protection       &#61; false&#10;  spot                      &#61; false&#10;  termination_action        &#61; null&#10;&#125;">&#123;&#8230;&#125;</code> |
| [scratch_disks](variables.tf#L227) | Scratch disks configuration. | <code title="object&#40;&#123;&#10;  count     &#61; number&#10;  interface &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  count     &#61; 0&#10;  interface &#61; &#34;NVME&#34;&#10;&#125;">&#123;&#8230;&#125;</code> |
| [service_account](variables.tf#L239) | Service account email. Unused if service account is auto-created. | <code>string</code> |  | <code>null</code> |
| [service_account_create](variables.tf#L245) | Auto-create service account. | <code>bool</code> |  | <code>false</code> |
| [service_account_scopes](variables.tf#L253) | Scopes applied to service account. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |
| [shielded_config](variables.tf#L259) | Shielded VM configuration of the instances. | <code title="object&#40;&#123;&#10;  enable_secure_boot          &#61; bool&#10;  enable_vtpm                 &#61; bool&#10;  enable_integrity_monitoring &#61; bool&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [tag_bindings](variables.tf#L269) | Tag bindings for this instance, in key => tag value id format. | <code>map&#40;string&#41;</code> |  | <code>null</code> |
| [tags](variables.tf#L275) | Instance network tags for firewall rule targets. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#93;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [external_ip](outputs.tf#L17) | Instance main interface external IP addresses. |  |
| [group](outputs.tf#L26) | Instance group resource. |  |
| [instance](outputs.tf#L31) | Instance resource. |  |
| [internal_ip](outputs.tf#L36) | Instance main interface internal IP address. |  |
| [internal_ips](outputs.tf#L44) | Instance interfaces internal IP addresses. |  |
| [self_link](outputs.tf#L52) | Instance self links. |  |
| [service_account](outputs.tf#L57) | Service account resource. |  |
| [service_account_email](outputs.tf#L64) | Service account email. |  |
| [service_account_iam_email](outputs.tf#L69) | Service account email. |  |
| [template](outputs.tf#L77) | Template resource. |  |
| [template_name](outputs.tf#L82) | Template name. |  |

<!-- END TFDOC -->
## TODO

- [ ] add support for instance groups
