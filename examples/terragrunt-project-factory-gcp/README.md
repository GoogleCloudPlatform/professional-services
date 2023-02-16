# A 'state-scalable' project factory pattern with Terragrunt

## Overview

Resolves the problem of state volume explotion with project factory. Terragrunt helps with that by:

1. Providing a dynamic way to configure [remote_state](https://terragrunt.gruntwork.io/docs/features/keep-your-remote-state-configuration-dry/#keep-your-remote-state-configuration-dry) for categories of resources in directories.
1. Providing [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself) configuration of source code by generating code in target directories using dynamic [source](https://terragrunt.gruntwork.io/docs/features/keep-your-terraform-code-dry/#motivation) definitions.
1. Drastically reduce time to perform `terraform plan` or `terraform apply` by supporting [parallel](https://terragrunt.gruntwork.io/docs/features/execute-terraform-commands-on-multiple-modules-at-once/) execution of resource plans.

This pattern scales the 'factory' oriented approach of IaC implementation, facilitating both scalability of the Terraform state file size and also developer productivity by minimizing time to run *plans*. By providing mechanisms to create resource group definitions using both local and common data configurations through `defaults`, and implementing `DRY` code in a central `source`, it encourages a mature `Infrastructure as Data` implementation practice.

## Expalanation

![Diagram](/docs/images/image2.png)

Implementing a factory oriented pattern for deploying resource groups is a common practice in IaC (Infrastructure as Code). This is typically done by having a configurable blueprint of data to describe the infrastructure to avoid repetition of code. [Project-factory](https://registry.terraform.io/modules/terraform-google-modules/project-factory/google/latest) is a common manifestation of this requirement since in GCP, projects need to be created ubiquitously.

 This pattern can however result in intractable state file sizes resulting in slow pipeline steps everytime `terraform plan` or `apply` needs to run, because it reads all resources from the Cloud environment. The general guideline from [Google Cloud's documentation](https://cloud.google.com/docs/terraform/best-practices-for-terraform#minimize-resources) is that each state file should not have more than 100 resources -- which itself can be obfuscated by the use of modules. This example provides a solution to *state explosion* using Terragrunt.

In addition, it describes a pattern such that the *Terraform source code* for implementing resources can be defined in the sub-directory as a data configuraiton, instead of repeating the code.

Generally, this pattern splits IaC into `data` and `src` directories at the top level with their configuration connected by `terragrunt.hcl` files at different levels of the file hierarchy. In this example, the public `project-factory` module is used to create projects for `team1` and `team2` categories, while maintaining separate state files using the Terragrunt's configuration. As described in the diagram below, the state files for each category would be stored in the following GCS bucket URL paths:

```
Team1 -  gcs://<bucket>/data/team1/default.state
Team2 -  gcs://<bucket>/data/team2/default.state
```

This is enabled by the root `terragrunt.hcl` file located under the repository root, defining a dynamic `remote-back-end` configuration that is set at the subdirectory level.

```terraform
# Root -> terragrunt.hcl

remote_state {
  backend = "gcs"
  config = {
    bucket   = local.vars.bucket_prefix
    prefix   = path_relative_to_include()
    project  = local.vars.root_project
    location = local.vars.region
  }
}
```

Under the subdirectory for team1, the `include` block is defined and the `path` variable is set relative to the root configuration.

```
# Root -> data -> team1 -> terragrunt.hcl

include "root" {
  path = find_in_parent_folders()
}
```

### Dynamic source configuration

An additional configuration defined in the `terragrunt.hcl` file for team1 is the `terraform` block. This specifies that the source code for the data configuration describing the resources for this directory will be implemented by following `terraform` -> `source` code. Terragrunt manages a temporary instance of the source code inside a directory `.terragrunt-cache`, absolving the developer from maintaining several instances of the code base in different data subdirectories.

```terraform
# Root -> data -> team1 -> terragrunt.hcl

terraform {
  # Pull the terraform configuration from the local file system. Terragrunt will make a copy of the source folder in the
  # Terragrunt working directory (typically `.terragrunt-cache`).
  source = "../..//src"

  # Files to include from the Terraform src directory
  include_in_copy = [
    "main.tf",
    "variables.tf",
    "outputs.tf",
    "provider.tf"
  ]
}
```

In this example, the `terraform` configuration of a local source code module in `src/` is provided, which simply invokes the public `project-factory` module by flattening the specifications provided in `default` and `data` directories. In practice, instead of local ones this can be modules hosted in private or public registries implementing IaC blueprints for common use-cases -- eg. Projects and supporting resoources for Data Platform Teams and Application Teams.

## Requirements

A few resoures need to be created before running terragrunt. Either use the terraform scripts under setup folder or follow manual steps given below.
In either case make sure individual running the steps have folder creator, project creator and storage admin roles.

### Setup by terraform scripts

1. cd setup
2. Create a terraform.tfvars from the sample with the correct org_id, billing_account, default region and bucket name where state will be stored.
3. This creates resources that are needed to run the sample terragrunt project factory.

- "terragrunt_test" folder under org
- "terragrunt-seedproject" project under "terragrunt_test" folder
- "terragrunt-iac-core-bkt" GCS Bucket for storing state
- "Team1" and "Team2" folders
- Generate root.yaml and defaults.yaml files inside the teams' directoriees from template files.

```
terraform init
terraform plan
terraform apply
```

### Manual setup

- Create two Folders where Terragrunt will create projects. Add corresponding folders id's in data/team/defaults.yaml and data/team2/defaults.yaml
- Create a Project to store terraform state and a gcs bucket in that project.
- Add project_id and gcs_bucket name in root.yaml.


## How to run
*Steps 2 to 5 can be skipped if you ran the setup scripts*

1. [Install Terragrunt](https://terragrunt.gruntwork.io/docs/getting-started/install/)
1. Create [folders](https://cloud.google.com/resource-manager/docs/creating-managing-folders#creating-folders) in your organization; similar to `team1`, `team2` as shown in sample. 
1. Create project files in data \<category\>  projects similar to `*.yaml.sample` files provided to project specific configurations.
1. Create defaults.yaml file for each category similar to `defaults.yaml.sample` file provided for common configurations.
1. Create root.yaml file similar to `root.yaml.sample` for remote backend configurations.

```
terragrunt run-all init
terragrunt run-all plan
terragrunt run-all apply
```

**Note: `terragrunt plan` or `apply` can be run directly in subdirectories (ie. data/team1 etc) with a `terragrunt.hcl` file, to create resources for each team. This is useful for separating pipelines. `terragrunt run-all` is useful for runnning all deployments at once and in parallel.** 

## Variations

- A version of this pattern that integrates easy with [Fabric FAST](https://github.com/GoogleCloudPlatform/cloud-foundation-fabric/tree/master/blueprints/factories/project-factory) or [Cloud Foundatiaon Toolkit](https://github.com/GoogleCloudPlatform/cloud-foundation-toolkit)

## Resources

- [Terragrunt](https://terragrunt.gruntwork.io/docs/getting-started)

- [*Infrastructure as Data*](https://medium.com/dzerolabs/shifting-from-infrastructure-as-code-to-infrastructure-as-data-bdb1ae1840e3) Medium link
- [Splitting a monolithic Terraform state using Terragrunt](https://medium.com/cts-technologies/murdering-monoliths-using-terragrunt-to-split-monolithic-terraform-state-up-into-multiple-stacks-17ead2d8e0e9)

## TODO

1. Update example with different service accounts for team directories
1. Create branches for variations. Variations can be like, integrating with FAST Fabric project factory pattern eg.

## Caveats

- Terragrunt has [restrictions](https://docs.gruntwork.io/guides/working-with-code/tfc-integration) when it comes to integrating with Hashicorp's Terraform Cloud or Terraform Cloud Enterprise platform. TL;DR: You can still use TCE/TC for storing states, monitoring and auditing but cannot use the UI for Terraform runs. Initiating runs using the CLI is still possible.
