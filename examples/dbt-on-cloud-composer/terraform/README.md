## Terraform template to setup the composer environment

This terraform template serves as a starting point for the private VPC Composer setup. There are two versions of Cloud Composer configured. 
The recommended setup should be Composer2 as for its simplicity and its great autoscaling capacity.

Create the `terraform.tfvars` file replacing the right values for each variable. 

```bash
echo 'project_id = "gcp_project_name"' >> terraform.tfvars
echo 'region = "europe-west4"' >> terraform.tfvars
echo 'organization = "organizations/12345678"' >> terraform.tfvars
echo 'root_node = "folders/1234"' >> terraform.tfvars
echo 'prefix = "my-prefix"' >> terraform.tfvars
echo 'owners = ["user:admin@example.com"]' >> terraform.tfvars
echo 'billing_account_id = "123456789"' >> terraform.tfvars
echo 'quota_project = "my-my_quota_project_id"' >> terraform.tfvars
```

Also, make sure you have the right `backend.tf` configuration in place. Terraform [documentation](https://www.terraform.io/language/settings/backends/configuration).

You can use a sample configuration:
```
terraform {
 backend "gcs" {
   bucket  = "<bucket_name>"
   prefix  = "<prefix>/state"
 }
}
```

For the detailed definitions of all the configuration variables please inspect `variables.tf` file.


And then run:
```bash
terraform init
terraform plan
terraform apply
```