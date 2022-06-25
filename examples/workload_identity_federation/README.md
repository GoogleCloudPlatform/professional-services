# Workload Identity Federation

This repository provides an example for creating a Workload Identity Federation (WIF) Component that could be used for
authenticating to Google Cloud from a GitLab CI/CD job using a JSON Web Token (JWT) token. This configuration generates
on-demand, short-lived credentials without needing to store any secrets.

This example assumes you have a Google Cloud account and a Google Cloud project. 
Your account must have at least the Workload Identity Pool Admin permission on the Google Cloud project.

## Create Workload Identity Federation

- Create an account in [Google Cloud](https://cloud.google.com/sdk/gcloud)
- Create an account in [GitLab](https://about.gitlab.com/)
- Install [GCloud CLI](https://cloud.google.com/sdk/gcloud) following this [guide](https://cloud.google.com/sdk/docs/install)
- Install [Terraform](https://www.terraform.io/) following this [guide](https://learn.hashicorp.com/tutorials/terraform/install-cli)
- Install [GCloud CLI](https://cloud.google.com/sdk/gcloud) following this [guide](https://cloud.google.com/sdk/docs/install)

## Create Workload Identity Federation

- Configure the variables required for creating the Workload Identity Provider.
```
cd 1-create-wif
vim terraform.tfvars

#Edit this variables
project_id             = {id of the gcp project in which you will povision the WIF}
gitlab_url             = {url of gitlab, by default is https://gitlab.com}
gitlab_project         = {url of the project in gitlab}
gitlab_service_account = {a name for the service account that will be created}
```

- Execute Terraform command to provision .
```
terraform init
terraform plan
terraform apply
```

## Use Workload Identity Federation in GitLab

Since this repository includes an example for authenticating to Google Cloud from a GitLab CI/CD job, the file .gitlab-ci.yml should be changed in these values:
```
PROJECT_ID           : {id of the gcp project in which you will povision your infrastructure}
PROJECT_NUMBER       : {number of the gcp project in which you created the WIF}
POOL_ID              : {name of the workload identity pool that you created in WIF}
PROVIDER_ID          : {name of the workload identity provider that you created in WIF}
SERVICE_ACCOUNT_EMAIL: {name of the service account asssociated to WIF}
```

## Collaborate with your team

- [ ] [Invite team members and collaborators](https://docs.gitlab.com/ee/user/project/members/)
- [ ] [Create a new merge request](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html)
- [ ] [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
- [ ] [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
- [ ] [Automatically merge when pipeline succeeds](https://docs.gitlab.com/ee/user/project/merge_requests/merge_when_pipeline_succeeds.html)

## Test and Deploy

Push this repository in the Gitlab project and verify that the VPC included in the main.tf file was provisioned.

## References
- [ ] [Get started with Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [ ] [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/index.html)
- [ ] [Configure OpenID Connect with GCP Workload Identity Federation](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)

