# IAM Permissions copier

Table of contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Usage](#usage)
- [Testing](#testing)
- [Limitations](#limitations)
- [FAQ](#faq)

## Overview
This tool allows you to copy supported Google Cloud Platform IAM permissions from unmanaged users to managed Cloud Identity users. 

This tool is best used for accounts in conflict status, or for users that have access to GCP with personal Google accounts that need to use corporate accounts.

### Example Use Cases
- Google Cloud Platform users have been using their personal accounts  (e.g. @gmail.com), but need to begin using corporate-managed accounts (e.g. @mydomain.com)
- Users with conflicting accounts (those ending in @gtempaccount.com) that need to copy permissions to a managed, corporate account

### Supported Modes
This tool can copy permissions between user accounts using either a regular expression pattern or a static mapping file.

**Pattern Mapping**

In Pattern Mapping mode, IAM permissions will be mapped for all users that match a pre-defined pattern.

For example, here is a conflict:
- Current consumer account domain: %mydomain.com@gtempaccount.com
- New Domain: mydomain.com
- Pattern: `user:(.*)%mydomain.com@gtempaccount.com`

Before
| User                                  | Resource          | Role              
| -----------                           | -----------       | -----------       
| janet%mydomain.com@gtempaccount.com   | Organization      | Organization Admin
| john%mydomain.com@gtempaccount.com    | Project           | Project Editor
| john%mydomain.com@gtempaccount.com    | BigQuery Dataset | Data Viewer

After
| User                                  | Resource          | Role              
| -----------                           | -----------       | -----------       
| janet%mydomain.com@gtempaccount.com   | Organization      | Organization Admin
| john%mydomain.com@gtempaccount.com    | Project           | Project Editor
| john%mydomain.com@gtempaccount.com    | BigQuery Dataset | Data Viewer    
| janet@mydomain.com                    | Organization      | Organization Admin
| john@mydomain.com                     | Project           | Project Editor
| john@mydomain.com                     | BigQuery Dataset | Data Viewer

_Note: If users from the old domain are already managed by Cloud Identity, then use the [email address change instructions](https://support.google.com/cloudidentity/answer/182084?hl=en) in Cloud Identity._


**Static File Mapping**

In Static File Mapping mode, IAM permissions will be mapped for all users that are defined in a mapping file. An example static mapping file (`example_map_file.csv`) is included in the repo and printed below. For each row in the file, permissions are copied from the “current” account to the “desired” account.

Mapping File (`example_map_file.csv`)
```
current,desired
janet@gmail.com,janet@mydomain.com
john@gmail.com,john@mydomain.com
susan@gmail.com,susan@mydomain.com

```

## Prerequisites
### Permissions
The user executing the script will need a role with the following permissions, which allow them to view and make changes to IAM bindings for each of the supported resources:

```
storage.buckets.getIamPolicy
storage.buckets.setIamPolicy
bigquery.datasets.getIamPolicy
bigquery.datasets.setIamPolicy
resourcemanager.projects.getIamPolicy
resourcemanager.projects.setIamPolicy
resourcemanager.folders.setIamPolicy
resourcemanager.folders.getIamPolicy
resourcemanager.organizations.getIamPolicy
resourcemanager.organizations.setIamPolicy
billing.accounts.getIamPolicy
billing.accounts.setIamPolicy 
```

The Security Admin role (roles/iam.securityAdmin) has permission to get and set any IAM policy, including those listed above. 

### Environment Setup
You must have an environment running Python. The Python version used when writing this script was 3.9.7. 

It's recommended to run this script inside a Python virtual environment. In your local environment or CloudShell, make sure the Python virtual environment is installed (`pip install virtualenv`) and created (`virtualenv venv`) before running the activation command (`source venv/bin/activate`). Then, clone the repository, change into the iam-permissions-copier directory, and install dependencies (`pip install -r requirements.txt`).

## Usage
The tool uses a Python script to discover assets and permissions across your Google Cloud Organization, then re-applies those permissions to the new user account. `iam.py` is the main file, and it supports two subcommands: `generate-inventory-file` and `run`.

### Command structure and flags
- `python iam.py generate-inventory-file --org-id=<GCP Org ID>`
- `python iam.py run --dry-run=<true|false> [--filename=<inventory filename> | --org-id=<GCP Org ID>]  [--map-file=<manual mapping file>] `

### Generating Cloud Asset Inventory
The script requires a Cloud Asset Inventory (CAI), which includes the current IAM bindings of users and permissions. The inventory can be generated and output with the `generate-inventory-file` command below, or created dynamically during execution of the run command. 

```
python iam.py generate-inventory-file --org-id=<GCP Org ID>
```
### Configuring Mapping Parameters
In `constants.py`, assign your domain name to the ORGANIZATION_NAME constant.

### Dry Run
When running the script for the first time, you can execute the run command in dry-run mode. This will verify that the user running the script has the correct permissions to retrieve and set IAM permissions on each of the supported resources and give you a preview of the IAM changes that could be made. **No permissions will be changed when dry-run is true.**

```
python iam.py run --dry-run=true --org-id=$GCP_ORG_ID --verify-permissions=true
```

### Copying Permissions
This is the main command that works in two stages. First, it traverses the provided inventory file and then provides a list of "tainted" resources that need their permissions fixed. Secondly, if the provided list of IAM changes looks good to you, you may proceed by entering yes to continue with the actual execution.

When executed with the `run` command, the script scans the inventory file, looking for role bindings on supported resources attached to the user’s consumer account. If permissions on this account are found, add a binding with the same role to the user’s managed account. For example, if “natalie%mydomain.com@gtempaccount.com” is found to have the “roles/bigquery.dataViewer” binding, then grant that same role binding to “natalie@mydomain.com”.

The script will output a file that documents all permissions changes that were made during execution.

```
python iam.py run --dry-run=true --org-id=$GCP_ORG_ID --verify-permissions=true```
```

## Testing
Tests are located inside the tests directory. There are a couple of different tests you may run.

### Environment Variables
There are some required environment variables when running tests. You should set these in your local shell environment.

- `export TEST_ORG_ID=<org-id>` The GCP organization to create the resources under. Also used to create a static organization to test permissions against as it's not feasible to spin up organizations frequently for testing.
- `export TEST_EMAIL=<email-address>` A real user email address to use for adding IAM roles to the test resources.
- `export TEST_PROJECT_ID=<project-id>` A base GCP project to create the resources under unless we are creating a project resource.
- `export TEST_BILLING_ACT_ID=<billing-account-id>` A billing account to test permissions against. It's not feasible to actually spin up billing accounts and tear them down frequently for testing.

### Permissions Test
This test tries to ensure you have the proper permissions from the calling user to execute the integration test and create the actual resources. Execute with this command: `python -m unittest tests/test_permissions.py`

### Integration Test
This test creates real resources inside a GCP environment and then adds new permissions to each resource created. Ensure you have set your environment variables before running. Execute with this command: `python -m unittest tests/test_integration.py`

### Unit Tests
This tests basic functions around the base resource class itself. Execute with this command: `python -m unittest tests/test_base_resource.py`

## Limitations
### Supported Resources
The script only copies permissions on the following GCP resources:
- GCS Buckets
- BigQuery datasets
- Projects
- Folders
- Organizations
- Billing Account

### Supporting additional resources
To support an additional resource, you must create a new class that extends from the base Resource class found in `resources/base.py`. The reason for the class-per-resource model is GCP APIs are different on a per resource basis and require special customizations to perform the same operation on each resource.

In the case of resources that rely on the Resource Manager API, you should extend from the ResourceManagerResource class.

Each resource class that is created must define a `_client` method that provides the particular API client for that particular resource. Most of the other methods in the base Resource class can be overridden to make particular customizations for each resource.

### Project Owner Invitees
The script does not copy users with the "roles/resourcemanager.projectOwnerInvitee" role. These are users who have been invited to own a project but have not yet accepted.

## FAQ

### Is there a rollback option?
Currently the script does not provide a mechanism for reverting IAM changes. However, the pending IAM changes are printed to the console for your review and approval before the changes are made. Additionally, once the script has executed, you will have an audit trail of all IAM changes with the csv output file.

### How are the permissions updated? 
The pending updates are determined by the mapping file (provided at runtime) and dynamic mapping configuration (@gtempaccount.com => @mydomain.com). The script evaluates the permissions that are assigned to a user’s consumer account (e.g., user@gmail.com, user%mydomain.com@gtempaccount.com) on the supported resources and adds any permission that is not yet assigned to the user’s target managed account (i.e., user@mydomain.com). It is additive, meaning that no permissions are revoked or overwritten in the process.

### What happens if a target account already has the permission being copied from the corresponding temporary account?
Nothing. If the user account already has the permission, then the script continues to the next permission.
