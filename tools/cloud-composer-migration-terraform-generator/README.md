# cloud-composer-migration-terraform-generator

## Table Of Contents

1. [Use Case](#use-case)
2. [About](#about)
3. [Setup](#setup)
4. [Results](#results)

----

## use-case

For customers looking to migrate their Google Cloud Composer Version 1 environments to Composer 2. 

----

## about

### Tools

Analyzes an existing Cloud Composer 1 / Airflow 1 environment and generates terraform.

Configures new Cloud Composer 2 environment to meet your workload.

----

## setup

1. Ensure that an existing Cloud Composer 1 environment exists
2. Run the script

```bash
./terraform-generate.sh -p your-project -l your-location -e your-environment
```

----

## results

1. Navigate to terraform-generator/terraform
2. review your-environment.tfvars for intended output
3. Run terraform

```bash
terraform init
terraform plan --var-file=your-environment.tfvars
terraform apply --var-file=your-environment.tfvars
```