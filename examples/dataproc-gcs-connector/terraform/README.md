## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|:-----:|
| dataproc\_cluster | Name for dataproc cluster | `any` | n/a | yes |
| dataproc\_subnet | Name for dataproc subnetwork to create | `any` | n/a | yes |
| hadoop\_version | Hadoop version for the GCS connector | `any` | n/a | yes |
| network\_name | The network your data pipelines should use | `any` | n/a | yes |
| project\_id | Project ID for your GCP project | `any` | n/a | yes |
| region | Region for Dataproc | `string` | `"us-central1"` | no |

## How to Use

This Terraform code builds a Dataproc cluster with the GCS connector from the master branch of the [GoogleCloudDataproc/hadoop-connectors](https://github.com/GoogleCloudDataproc/hadoop-connectors) GitHub. It will include creating a Google Cloud Storage bucket to store the JAR file of the GCS connector (see [this README](../README.md) for building the JAR) and the [initialization action](https://cloud.google.com/dataproc/docs/concepts/configuring-clusters/init-actions) for the Dataproc cluster.

Before running this code, you will need to confirm that the file path to the JAR on Line 23 of `main.tf` and the file path to the initialization action on Line 29 of `main.tf` are correct.

To run this code, set the input variables in the `variables.tf` file (also shown in the above section) to their respective values. Then run the following commands in this directory:

```bash
terraform init
terraform apply
```