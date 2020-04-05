## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
| billing\_account | The ID of the associated billing account | string | `""` | no |
| cluster\_location |  | string | `"us-central1-a"` | no |
| domain | The domain name of the Google Cloud Organization. Use this if you can't add Organization Viewer permissions to your TF ServiceAccount | string | `""` | no |
| enable\_helloworld\_app |  | string | `"false"` | no |
| enable\_hipsterstore\_app |  | string | `"true"` | no |
| folder\_id | The ID of the folder in which projects should be created \(optional\). | string | `""` | no |
| forseti\_cscc\_source\_id | Set the Cloud Security Command Center Source ID for Forseti integration | string | `""` | no |
| forseti\_cscc\_violations\_enabled | Enable Forseti Cloud Security Command Center integration by setting this to `true`. Default is `false` | string | `"false"` | no |
| gke\_minimum\_version |  | string | `"1.14.10-gke.27"` | no |
| in\_scope\_cluster\_name |  | string | `"in-scope"` | no |
| in\_scope\_pod\_ip\_range\_name |  | string | `"in-scope-pod-cidr"` | no |
| in\_scope\_project\_id |  | string | `""` | no |
| in\_scope\_services\_ip\_range\_name |  | string | `"in-scope-services-cidr"` | no |
| in\_scope\_subnet\_cidr |  | string | `"10.10.10.0/24"` | no |
| in\_scope\_subnet\_name |  | string | `"in-scope"` | no |
| is\_shared\_vpc\_host |  | string | `"true"` | no |
| management\_project\_id |  | string | `""` | no |
| mgmt\_subnet\_cidr |  | string | `"10.10.1.0/24"` | no |
| mgmt\_subnet\_name |  | string | `"management"` | no |
| network\_project\_id |  | string | `""` | no |
| node\_locations |  | list | `[ "us-central1-b" ]` | no |
| org\_id | The ID of the Google Cloud Organization. | string | `""` | no |
| out\_of\_scope\_pod\_ip\_range\_name | The Name for the Secondary IP range used for Out of Scope Kubernetes Pods | string | `"out-of-scope-pod-cidr"` | no |
| out\_of\_scope\_project\_id |  | string | `""` | no |
| out\_of\_scope\_services\_ip\_range\_name | The Name for the Secondary IP range used for Out of Scope Kubernetes Services | string | `"out-of-scope-services-cidr"` | no |
| out\_of\_scope\_subnet\_cidr |  | string | `"10.10.20.0/24"` | no |
| out\_of\_scope\_subnet\_name |  | string | `"out-of-scope"` | no |
| override\_inscope\_sa\_email |  | string | `""` | no |
| project\_prefix | Segment to prefix all project names with. | string | `"pci-poc"` | no |
| region |  | string | `"us-central1"` | no |
| remote\_state\_bucket | GCS state bucket | string | `""` | no |
| shared\_vpc\_name | The name of the Shared VPC network | string | `"shared-vpc"` | no |


