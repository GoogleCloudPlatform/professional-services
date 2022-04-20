## Terraform template to setup the composer environment

This terraform template serves as a starting point for the private VPC Composer setup. There are two versions of Cloud Composer configured. The recommended setup should be Composer2 as for its simplicity and its great autoscaling capacity.

Replace the tags in the `main.tf`, `backend.tf` and `terraform.tfvars` files by running the following command inside the current folder (and of course replacing the below example values with more meaningful ones):

```bash
egrep -rl '<gcp_project_name>' ./ | grep -v README.md | xargs -I@ sed -i '' "s/<gcp_project_name>/dbt_on_composer_project_id/g" @

egrep -rl '<region>' ./ | grep -v README.md | xargs -I@ sed -i '' "s/<region>/europe-west2/g" @

egrep -rl '<org_id>' ./ | grep -v README.md | xargs -I@ sed -i '' "s/<org_id>/123456789/g" @

egrep -rl '<folder_id>' ./ | grep -v README.md | xargs -I@ sed -i '' "s/<folder_id>/123456789/g" @

egrep -rl '<prefix>' ./ | grep -v README.md | xargs -I@ sed -i '' "s/<prefix>/my-prefix/g" @

egrep -rl '<admin_email_address>' ./ | grep -v README.md | xargs -I% sed -i '' "s/<admin_email_address>/admin$@example.com/g" %

egrep -rl '<billing_account>' ./ | grep -v README.md | xargs -I@ sed -i '' "s/<billing_account>/123456789/g" @

egrep -rl '<quota_project>' ./ | grep -v README.md | xargs -I@ sed -i '' "s/<quota_project>/my_quota_project_id/g" @

egrep -rl '<unique-bucket-to-store-terraform-state>' ./ | grep -v README.md | xargs -I@ sed -i '' "s/<unique-bucket-to-store-terraform-state>/my_globally_unique_terraform_bucket_name/g" @

```

All tags should be replaced (in-place) with the correct values.

For the detailed definitions of all the configuration variables please inspect `variables.tf` file.

And then run:
```bash
terraform init
terraform plan
terraform apply
```