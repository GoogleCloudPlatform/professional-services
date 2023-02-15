## Config Validator | Setup & User Guide

### Go from setup to proof-of-concept in under 1 hour

**Table of Contents**

* [Overview](#overview)
* [How to set up constraints with Policy Library](#how-to-set-up-constraints-with-policy-library)
  * [Get started with the Policy Library repository](#get-started-with-the-policy-library-repository)
  * [Instantiate constraints](#instantiate-constraints)
* [How to validate policies](#how-to-validate-policies)
  * [Deploy Forseti](#deploy-forseti)
  * [Policy Library Sync from Git Repository](https://forsetisecurity.org/docs/latest/configure/config-validator/policy-library-sync-from-git-repo.html)
  * [Policy Library Sync from GCS](https://forsetisecurity.org/docs/latest/configure/config-validator/policy-library-sync-from-gcs.html)
* [End to end workflow with sample constraint](#end-to-end-workflow-with-sample-constraint)
* [Contact Info](#contact-info)

## Overview

This tool is designed to perform policy validation check on Terraform resource changes. It will not help with ongoing monitoring in your organization heirarchy, so if you're looking for that, please find the [config-validator](https://github.com/GoogleCloudPlatform/config-validator) project and associated [policy-library](https://github.com/GoogleCloudPlatform/policy-library) to get started with Cloud Asset Inventory policies.

Designed as an offshoot from the aforementioned policy-library, we set out to design a similar library that targets resource changes before terraform deployments. By refactoring rego policies in our library, we were able to target `validation.resourcechange.terraform.cloud.google.com` instead of the forsetisecurity target for CAI data. This allows for policy control in cases when the current state of the enviornment would clearly conflict with security policies, but you can't enforce fine-grained control to allow for that state to exist while locking out nearby features from terraform. This would likely be the case in automated IAM role or permission granting in a project with a super-admin. The super-admin may need to be there, and if using CAI policy validation, the pipeline would always fail if you define policies that limit the scope of a user's control.

Keep in mind that this behavior may lead to security vulnerabilities, because the tool does not perform any ongoing monitoring.

## How to set up constraints with Policy Library

### Get started with the Policy Library repository

The Policy Library repository contains the following directories:

* `policies`
  * `constraints`: This is initially empty. You should place your constraint
        files here.
  * `templates`: This directory contains pre-defined constraint templates.
* `validator`: This directory contains the `.rego` files and their associated
    unit tests. You do not need to touch this directory unless you intend to
    modify existing constraint templates or create new ones. Running `make
    build` will inline the Rego content in the corresponding constraint template
    files.

This repository contains a set of pre-defined constraint
templates. You can duplicate this repository into a private repository. First
you should create a new **private** git repository. For example, if you use
GitHub then you can use the [GitHub UI](https://github.com/new). Then follow the
steps below to get everything setup.

This policy library can also be made public, but it is not recommended. By
making your policy library public, it would allow others to see what you
are and **ARE NOT** scanning for.

#### Duplicate Policy Library Repository

To run the following commands, you will need to configure git to connect
securely. It is recommended to connect with SSH. [Here is a helpful resource](https://help.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh) for learning about how
this works, including steps to set this up for GitHub repositories; other
providers offer this feature as well.

```
export GIT_REPO_ADDR="git@github.com:${YOUR_GITHUB_USERNAME}/policy-library.git"
git clone --bare https://github.com/tdesrosi/gcp-terraform-config-validator.git
cd policy-library.git
git push --mirror ${GIT_REPO_ADDR}
cd ..
rm -rf policy-library.git
git clone ${GIT_REPO_ADDR}
```

#### Setup Constraints

Then you need to examine the available constraint templates inside the
`templates` directory. Pick the constraint templates that you wish to use,
create constraint YAML files corresponding to those templates, and place them
under `policies/constraints`. Commit the newly created constraint files to
**your** Git repository. For example, assuming you have created a Git repository
named "policy-library" under your GitHub account, you can use the following
commands to perform the initial commit:

```
cd policy-library
# Add new constraints...
git add --all
git commit -m "Initial commit of policy library constraints"
git push -u origin master
```

#### Pull in latest changes from Public Repository

Periodically you should pull any changes from the public repository, which might
contain new templates and Rego files.

```
git remote add public https://github.com/tdesrosi/policy-library-tf-resource-change.git
git pull public main
git push origin main
```

### Instantiate constraints

The constraint template library only contains templates. Templates specify the
constraint logic, and you must create constraints based on those templates in
order to enforce them. Constraint parameters are defined as YAML files in the
following format:

```
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: # place constraint template kind here
metadata:
  name: # place constraint name here
spec:
  severity: # low, medium, or high
  match:
    target: [] # put the constraint application target here
    exclude: [] # optional, default is no exclusions
  parameters: # put the parameters defined in constraint template here
```

The <code><em>target</em></code> field is specified in a path-like format. It
specifies where in the GCP resources hierarchy the constraint is to be applied.
For example:

<table>
  <tr>
   <td>Target
   </td>
   <td>Description
   </td>
  </tr>
  <tr>
   <td>organizations/**
   </td>
   <td>All organizations
   </td>
  </tr>
  <tr>
   <td>organizations/123/**
   </td>
   <td>Everything in organization 123
   </td>
  </tr>
  <tr>
   <td>organizations/123/folders/**
   </td>
   <td>Everything in organization 123 that is under a folder
   </td>
  </tr>
  <tr>
   <td>organizations/123/folders/456
   </td>
   <td>Everything in folder 456 in organization 123
   </td>
  </tr>
  <tr>
   <td>organizations/123/folders/456/projects/789
   </td>
   <td>Everything in project 789 in folder 456 in organization 123
   </td>
  </tr>
</table>

The <code><em>exclude</em></code> field follows the same pattern and has
precedence over the <code><em>target</em></code> field. If a resource is in
both, it will be excluded.

The schema of the <code><em>parameters</em></code> field is defined in the
constraint template, using the
[OpenAPI V3](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#schemaObject)
schema. This is the same validation schema in Kubernetes's custom resource
definition. Every template contains a <code><em>validation</em></code> section
that looks like the following:

```
validation:
  openAPIV3Schema:
    properties:
      mode:
        type: string
      instances:
        type: array
        items: string
```

According to the template above, the parameter field in the constraint file
should contain a string named `mode` and a string array named
<code><em>instances</em></code>. For example:

```
parameters:
  mode: allowlist
  instances:
    - //compute.googleapis.com/projects/test-project/zones/us-east1-b/instances/one
    - //compute.googleapis.com/projects/test-project/zones/us-east1-b/instances/two
```

These parameters specify that two VM instances may have external IP addresses.
The are exempt from the constraint since they are allowlisted.

Here is a complete example of a sample external IP address constraint file:

```
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: TFGCPExternalIpAccessConstraintV1
metadata:
  name: forbid-external-ip-allowlist
spec:
  severity: high
  match:
    target: ["organizations/**"]
  parameters:
    mode: "allowlist"
    instances:
    - //compute.googleapis.com/projects/test-project/zones/us-east1-b/instances/one
    - //compute.googleapis.com/projects/test-project/zones/us-east1-b/instances/two
```

## How to validate policies

Follow the [instructions](https://cloud.google.com/docs/terraform/policy-validation/validate-policies)
to validate policies in your local or production environments.

## End to end workflow with sample constraint

In this section, you will apply a constraint that enforces IAM policy member
domain restriction using [Cloud Shell](https://cloud.google.com/shell/).

First click on this
[link](https://console.cloud.google.com/cloudshell/open?cloudshell_image=gcr.io/graphite-cloud-shell-images/terraform:latest&cloudshell_git_repo=https://github.com/tdesrosi/policy-tf-resource-change.git)
to open a new Cloud Shell session. The Cloud Shell session has Terraform
pre-installed and the Policy Library repository cloned. Once you have the
session open, the next step is to copy over the sample IAM domain restriction
constraint:

```
cp samples/constraints/iam_service_accounts_only.yaml policies/constraints
```

Let's take a look at this constraint:

```
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: TFGCPIAMAllowedPolicyMemberDomainsConstraintV2
metadata:
  name: service-accounts-only
  annotations:
    description:
      Checks that members that have been granted IAM roles belong to allowlisted
      domains. Block IAM role bindings for non-service accounts by domain
      (gserviceaccount.com)
spec:
  severity: high
  parameters:
    domains:
      - gserviceaccount.com
```

It specifies that only members from gserviceaccount.com domain can be present in
an IAM policy. To verify that it works, let's attempt to create a project.
Create the following Terraform `main.tf` file:

```
provider "google" {
  version = "~> 1.20"
  project = "your-terraform-provider-project"
}

resource "random_id" "proj" {
  byte_length = 8
}

resource "google_project" "sample_project" {
  project_id      = "validator-${random_id.proj.hex}"
  name            = "config validator test project"
}

resource "google_project_iam_binding" "sample_iam_binding" {
  project = "${google_project.sample_project.project_id}"
  role    = "roles/owner"

  members = [
    "user:your-email@your-domain"
  ]
}

```

Make sure to specify your Terraform
[provider project](https://www.terraform.io/docs/providers/google/getting_started.html)
and email address. Then initialize Terraform and generate a Terraform plan:

```
terraform init
terraform plan -out=test.tfplan
terraform show -json ./test.tfplan > ./tfplan.json
```

Since your email address is in the IAM policy binding, the plan should result in
a violation. Let's try this out:

```
gcloud beta terraform vet tfplan.json --policy-library=policy-library
```

The Terraform validator should return a violation. As a test, you can relax the
constraint to make the violation go away. Edit the
`policy-library/policies/constraints/iam_service_accounts_only.yaml` file and
append your email domain to the domains allowlist:

```
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: TFGCPIAMAllowedPolicyMemberDomainsConstraintV2
metadata:
  name: service-accounts-only
  annotations:
    description:
      Checks that members that have been granted IAM roles belong to allowlisted
      domains. Block IAM role bindings for non-service accounts by domain
      (gserviceaccount.com)
spec:
  severity: high
  parameters:
    domains:
      - gserviceaccount.com
      - your-email-domain.com
```

Then run Terraform plan and validate the output again:

```
terraform plan -out=test.tfplan
terraform show -json ./test.tfplan > ./tfplan.json
gcloud beta terraform vet tfplan.json --policy-library=policy-library
```

The command above should result in no violations found.

## Contact Info

Questions or comments? Please contact tdesrosi@google.com for this project, or validator-support@google.com for information about the terraform-validator project.
