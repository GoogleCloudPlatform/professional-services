## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
| disk\_encryption\_key | The KMS Key self link to use for Disk Encryption | string | n/a | yes |
| network\_project\_id | The project that contains the VPC for this module | string | n/a | yes |
| project\_id | The project to build this module's infrastructure | string | n/a | yes |
| region | The region for this module's infrastructure | string | n/a | yes |
| service\_account\_email | The Service Account Email ID to use for the Cluster | string | n/a | yes |
| subnetwork\_name | The simple name of the subnetwork. | string | n/a | yes |
| vpc\_name | The Name of the VPC to use for this module | string | n/a | yes |


