<!--*
Copyright 2022 Google LLC
 
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
 
   https://www.apache.org/licenses/LICENSE-2.0
 
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*-->

# Powerwash My Org

This tool provides an easy way to delete every project, folder, organization policy and IAM policy from a GCP
Organization.
To following steps are taken to clean the Organization:

1. Deletes all Organization Policies - To remove any possible restriction on creating Service Account keys.
2. Creates a Bootstrap project - To create a Service Account, as well as being used as Billing Project for the APIs
   requests.
3. Creates a Service Account - To perform all the actions along the script.
4. Deletes all projects and folders.
5. (Optional) Creates new Organization Policies - If set in the config.json file or arguments.
6. Deletes all IAM Policies - Except the ones established in the config.json or arguments
7. Delete Bootstrap project.

## Getting Started

### Requirements:

* Python >= 3.6
* Authenticated account with the following GCP roles:
    - `roles/orgpolicy.policyAdmin` (Organization Policy Administrator)
    - `roles/resourcemanager.projectCreator` (Project Creator)
    - `roles/iam.serviceAccountCreator` (Create Service Accounts)

### Authentication

Since this tool is using the [Python Cloud Client Libraries](https://cloud.google.com/python/docs/reference), it uses
the same authentication methods as the documentation
explains: https://cloud.google.com/docs/authentication/client-libraries

## Running the tool

There are two different ways of passing the arguments to script:

1. Configuration file
2. CLI arguments

#### Parameters:

1. `organization_id`: Organization ID of the GCP Organization to clean.
2. (Optional) `protected_principals`: List of the users, groups and/or service accounts which shouldn't be deleted by
   the script. It is highly recommendable to add the group or user that is executing this script to not be locked out of
   the organization.
3. (Optional) `organization_policies`: List of organization policies that should be applied to the Organization after
   the script is run.

### Configuration file

If there is a file called `config.json` at the root folder, it will take precedence over the arguments passed through
CLI.
An example configuration file is provided `example.config.json`.

```shell
python main.py
```

### CLI arguments

Parameters are passed as arguments:

```shell
python main.py --org <org_id> --iam <list_of_protected_principals> --orgpolicies <list_of_org_policies>
```

Note: Both `--iam` and `--orgpolicies` lists should be strings separated by commas.

## Extra

A basic Terraform script if also included inside the `terraform` folder to test the script. It will simply create folders, a project, organization policies and a service account.