## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
| mgmt\_subnet\_cidr | The IP CIDR block to allow access to for API calls and Management access. Don't set this to 0.0.0.0/0 | string | n/a | yes |
| network\_project\_id | The project that contains the VPC for this module | string | n/a | yes |
| network\_self\_link | The complete self link ID for the VPC network | string | n/a | yes |
| pod\_ip\_range\_name | The Secondary IP Range name for Pods | string | n/a | yes |
| project\_id | The project to build this module's infrastructure | string | n/a | yes |
| region | The region for this module's infrastructure | string | n/a | yes |
| service\_account\_email | The Service Account Email ID to use for the Cluster | string | n/a | yes |
| services\_ip\_range\_name | The Secondary IP Range name for Services | string | n/a | yes |
| subnetwork\_name | The simple name of the subnetwork. | string | n/a | yes |
| cluster\_location | The Zonal location of the GKE cluster master | string | `"us-central1-a"` | no |
| cluster\_name | The name of the Cluster | string | `"in-scope"` | no |
| cluster\_tags | Tags to apply on the cluster | list | `[ "in-scope" ]` | no |
| enabled | This module can be disabled by explicitly setting this to `false`. Default is `true` | string | `"true"` | no |
| env | The value of an `env` label to apply to the cluster | string | `"pci"` | no |
| gke\_minimum\_version | The minimum version to use for the GKE cluster | string | `"1.14.10-gke.27"` | no |
| node\_locations | The locations of the GKE cluster nodes | list | `[ "us-central1-b" ]` | no |


