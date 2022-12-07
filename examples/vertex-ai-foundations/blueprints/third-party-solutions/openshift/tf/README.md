# OpenShift Cluster Bootstrap

This example is a companion setup to the Python script in the parent folder, and is used to bootstrap OpenShift clusters on GCP. Refer to the documentation in the parent folder for usage instructions.
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [cluster_name](variables.tf#L23) | Name used for the cluster and DNS zone. | <code>string</code> | ✓ |  |
| [domain](variables.tf#L28) | Domain name used to derive the DNS zone. | <code>string</code> | ✓ |  |
| [fs_paths](variables.tf#L87) | Filesystem paths for commands and data, supports home path expansion. | <code title="object&#40;&#123;&#10;  credentials       &#61; string&#10;  config_dir        &#61; string&#10;  openshift_install &#61; string&#10;  pull_secret       &#61; string&#10;  ssh_key           &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> | ✓ |  |
| [host_project](variables.tf#L44) | Shared VPC project and network configuration. | <code title="object&#40;&#123;&#10;  default_subnet_name &#61; string&#10;  masters_subnet_name &#61; string&#10;  project_id          &#61; string&#10;  vpc_name            &#61; string&#10;  workers_subnet_name &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> | ✓ |  |
| [service_project](variables.tf#L124) | Service project configuration. | <code title="object&#40;&#123;&#10;  project_id &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> | ✓ |  |
| [allowed_ranges](variables.tf#L17) | Ranges that can SSH to the boostrap VM and API endpoint. | <code>list&#40;any&#41;</code> |  | <code>&#91;&#34;10.0.0.0&#47;8&#34;&#93;</code> |
| [disk_encryption_key](variables.tf#L33) | Optional CMEK for disk encryption. | <code title="object&#40;&#123;&#10;  keyring    &#61; string&#10;  location   &#61; string&#10;  name       &#61; string&#10;  project_id &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [install_config_params](variables.tf#L57) | OpenShift cluster configuration. | <code title="object&#40;&#123;&#10;  disk_size &#61; number&#10;  labels    &#61; map&#40;string&#41;&#10;  network &#61; object&#40;&#123;&#10;    cluster     &#61; string&#10;    host_prefix &#61; number&#10;    machine     &#61; string&#10;    service     &#61; string&#10;  &#125;&#41;&#10;  proxy &#61; object&#40;&#123;&#10;    http    &#61; string&#10;    https   &#61; string&#10;    noproxy &#61; string&#10;  &#125;&#41;&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code title="&#123;&#10;  disk_size &#61; 16&#10;  labels    &#61; &#123;&#125;&#10;  network &#61; &#123;&#10;    cluster     &#61; &#34;10.128.0.0&#47;14&#34;&#10;    host_prefix &#61; 23&#10;    machine     &#61; &#34;10.0.0.0&#47;16&#34;&#10;    service     &#61; &#34;172.30.0.0&#47;16&#34;&#10;  &#125;&#10;  proxy &#61; null&#10;&#125;">&#123;&#8230;&#125;</code> |
| [post_bootstrap_config](variables.tf#L102) | Name of the service account for the machine operator. Removes bootstrap resources when set. | <code title="object&#40;&#123;&#10;  machine_op_sa_prefix &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [region](variables.tf#L110) | Region where resources will be created. | <code>string</code> |  | <code>&#34;europe-west1&#34;</code> |
| [rhcos_gcp_image](variables.tf#L116) | RHCOS image used. | <code>string</code> |  | <code>&#34;projects&#47;rhcos-cloud&#47;global&#47;images&#47;rhcos-47-83-202102090044-0-gcp-x86-64&#34;</code> |
| [tags](variables.tf#L131) | Additional tags for instances. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#34;ssh&#34;&#93;</code> |
| [zones](variables.tf#L137) | Zones used for instances. | <code>list&#40;string&#41;</code> |  | <code>&#91;&#34;b&#34;, &#34;c&#34;, &#34;d&#34;&#93;</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [backend-health](outputs.tf#L17) | Command to monitor API internal backend health. |  |
| [bootstrap-ssh](outputs.tf#L27) | Command to SSH to the bootstrap instance. |  |
| [masters-ssh](outputs.tf#L37) | Command to SSH to the master instances. |  |

<!-- END TFDOC -->
