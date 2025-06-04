# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# iamdeny-next2025
Repo for Next 2025

# Terraform Google Cloud IAM Deny and Organization Policies

## Description

This Terraform configuration sets up a series of security guardrails within a Google Cloud organization using IAM Deny Policies and Organization Policies. It aims to restrict specific high-privilege permissions and enforce organizational standards at both the organization and a designated folder level.

Key components include:
* An organization-level IAM Deny Policy targeting specific administrative permissions on resources tagged with a user-defined tag (e.g., `iam_deny=enabled`). **Note:** You must replace the placeholder tag IDs in `main.tf` with your actual tag key/value IDs.
* A folder-level IAM Deny Policy restricting Billing, Security (including numerous Security Command Center permissions), and Networking permissions on resources *unless* they have any tag applied.
* A Custom Organization Policy Constraint to prevent the use of the primitive `roles/owner` role.
* An Organization Policy restricting the usage of specific Google Cloud services (`securitycenter.googleapis.com`, `accessapproval.googleapis.com`) within a designated folder.

## Features

* Applies granular IAM Deny policies based on permissions defined in external JSON files (`billing.json`, `networking.json`, `securitycenter.json`) and an internal list (`denied_perms.tf`).
* Utilizes a user-defined resource tag (e.g., `iam_deny=enabled`) to conditionally apply the organization-level deny policy. **Requires updating placeholder IDs in `main.tf`**.
* Applies folder-level deny policies based on the *absence* of any resource tags, covering Billing, Networking, and Security Center permissions.
* Provides exceptions for specific principals (e.g., dedicated groups for networking, billing, security) for each deny policy rule.
* Enforces a custom constraint against the `roles/owner` role.
* Restricts specific service usage within a target folder using a standard Organization Policy constraint.

## Prerequisites

1.  **Terraform:** Terraform CLI (version compatible with provider requirements) installed.
2.  **Google Cloud Provider:** Configured authentication for the Terraform Google providers (e.g., via `gcloud auth application-default login` or Service Account key).
3.  **Permissions:** The identity running Terraform needs sufficient permissions, typically granted at the **Organization level**. Consider assigning roles like:
    * **IAM Deny Admin** (`roles/iam.denyAdmin`) for `iam.denyPolicies.*` permissions.
    * **Organization Policy Administrator** (`roles/orgpolicy.policyAdmin`) for `orgpolicy.*` permissions.
    * **Tag User** (`roles/resourcemanager.tagUser`) or **Tag Viewer** (`roles/resourcemanager.tagViewer`) for reading tag information (`resourcemanager.tagValues.get`, `resourcemanager.tagKeys.get`).
    * **Organization Viewer** (`roles/resourcemanager.organizationViewer`) or broader roles like **Folder Admin** (`roles/resourcemanager.folderAdmin`) for `resourcemanager.organizations.get` and `resourcemanager.folders.get`.
4.  **Organization ID:** Your Google Cloud Organization ID.
5.  **Target Folder ID:** The ID of the specific Google Cloud Folder (`folder_id`) where folder-level policies will be applied.
6.  **Tag Setup:** You need to create a suitable tag (e.g., `iam_deny=enabled`) within your Google Cloud organization. Obtain the specific numeric IDs for the Tag Key and Tag Value.
    * **Crucially, you must replace the placeholder tag key ID and tag value ID** in the `google_iam_deny_policy.top_level_deny` resource within your `main.tf` file (around line 32) with your actual IDs. Look for the `resource.matchTagId('tagKeys/*', 'tagValues/*')` expression.
7.  **Permission Files:** The required profile JSON files (`billing.json`, `networking.json`, `securitycenter.json`) are located within the `/terraform/profiles/` directory of this repository.

## Usage

1.  **Clone Repository:** Clone this repository to your local machine.
    ```bash
     git clone https://github.com/kevinschmidtG/iamdeny-next2025
    ```
2.  **Navigate to Directory:** Change into the Terraform directory within the cloned repository.
    ```bash
    cd terraform
    ```
    *(All subsequent commands should be run from this `/terraform` directory)*
3.  **Update `main.tf` Tag IDs:** **This is a critical step.** Open the `main.tf` file. Locate the `google_iam_deny_policy.top_level_deny` resource. Inside its `denial_condition` block (around line 32), you **must replace** the generic `'tagKeys/*'` and `'tagValues/*'` in the `expression = "resource.matchTagId('tagKeys/*', 'tagValues/*')"` line with your specific TagKey ID and TagValue ID that you created as part of the prerequisites.
4.  **Prepare Variables File:**
    * Copy the example variables file (`terraform.tfvars.example`) to the name Terraform automatically loads (`terraform.tfvars`):
      ```bash
      cp terraform.tfvars.example terraform.tfvars
      ```
    * Edit the new `terraform.tfvars` file.
    * **IMPORTANT: Replace all placeholder values** (like `YOUR_ORG_ID`, `YOUR_FOLDER_ID`, group emails `...@example.com`) with your actual Organization ID, target Folder ID (`folder_id`), and principal group emails/identifiers for the exceptions. Refer to the "Inputs" section for details on each variable.
5.  **Initialize Terraform:**
    ```bash
    terraform init
    ```
6.  **Review Plan:** Terraform will automatically load variables from `terraform.tfvars`.
    ```bash
    terraform plan
    ```
7.  **Apply Configuration:**
    ```bash
    terraform apply
    ```

## Resources Created

This configuration will create the following Google Cloud resources:

* **`google_iam_deny_policy.top_level_deny`**: An IAM Deny Policy attached at the organization level, denying a broad set of permissions on resources tagged with your specified tag (defined by `resource.matchTagId` in `main.tf`).
* **`google_iam_deny_policy.profile-deny-policy`**: An IAM Deny Policy attached at the folder level (`var.folder_id`), denying specific Billing, Security, and Networking permissions on resources that *do not* have any tags applied.
* **`google_org_policy_custom_constraint.deny_owner`**: A Custom Organization Policy Constraint (`custom.denyOwner`) defined at the organization level, which specifies a condition to deny the `roles/owner` primitive role.
* **`google_org_policy_policy.bool`**: An Organization Policy that enforces the `custom.denyOwner` constraint at the organization level.
* **`module "gcp_org_policy_v2"`**: This module is used to create an Organization Policy attached at the folder level (`var.folder_id`) that enforces `gcp.restrictServiceUsage` to deny the usage of specified services (e.g., `securitycenter.googleapis.com`, `accessapproval.googleapis.com`).

## Inputs

| Name                            | Description                                                                                                                               | Type         | Default                                      | Required |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------- | :------: |
| `org_id`                        | Your Google Cloud Organization ID. **Must be set in `terraform.tfvars`.**                                                                 | `string`     | `""` (Effectively N/A - Must be provided)  |   Yes    |
| `folder_id`                     | The folder ID where folder-level policies will be attached. **Must be set in `terraform.tfvars`.**                                         | `string`     | `""` (Effectively N/A - Must be provided)  |   Yes    |
| `networking_exception_principals` | List of principals exempt from the networking deny rule. Format: `principalSet://goog/group/GROUP_EMAIL_ADDRESS`. See [IAM Principals](https://cloud.google.com/iam/docs/principal-identifiers). | `list(string)` | `[]`                                         |    No    |
| `billing_exception_principals`  | List of principals exempt from the billing deny rule. Format: `principalSet://goog/group/GROUP_EMAIL_ADDRESS`.                              | `list(string)` | `[]`                                         |    No    |
| `sec_exception_principals`      | List of principals exempt from the security deny rule. Format: `principalSet://goog/group/GROUP_EMAIL_ADDRESS`.                               | `list(string)` | `[]`                                         |    No    |
| `top_exception_principals`      | List of principals exempt from the organization-level deny policy. Format: `principalSet://goog/group/GROUP_EMAIL_ADDRESS`.                  | `list(string)` | `[]`                                         |    No    |
| `folder_path`                   | The prefix for the folder resource path.                                                                                                  | `string`     | `"cloudresourcemanager.googleapis.com/folders/"` |    No    |
| `region`                        | The default Google Cloud region for the provider.                                                                                         | `string`     | `"us-central1"`                              |    No    |
| `zone`                          | The default Google Cloud zone for the provider.                                                                                           | `string`     | `"us-central1-c"`                            |    No    |

**Important Note on `terraform.tfvars`:** The `terraform.tfvars.example` file provides the structure for your `terraform.tfvars` file. You **must** update `org_id`, `folder_id`, and any desired exception principals in `terraform.tfvars` before applying the configuration. The default empty string `""` for `org_id` and `folder_id` in the table above are placeholders in the variable definitions; they will cause errors if not overridden. Exception principal lists default to empty `[]` if not specified, meaning no exceptions.

## Outputs

No outputs are defined in this configuration.

## Providers

| Name          | Version |
| ------------- | ------- |
| hashicorp/google | >= 5.0.0 |
| hashicorp/google-beta | >= 5.0.0 |

## Modules

| Name                | Source                                                     | Version |
| ------------------- | ---------------------------------------------------------- | ------- |
| gcp_org_policy_v2 | terraform-google-modules/org-policy/google//modules/org_policy_v2 | ~> 5.3.0 |

## Related Modules & Concepts

### Privileged Access Management (PAM)

This repository focuses on preventative controls using IAM Deny and Organization Policies. For managing temporary, just-in-time elevated access (which might be needed for principals requiring exceptions to these policies), consider using a Privileged Access Management approach.

Google Cloud provides a reference implementation for PAM using Terraform:
* **terraform-google-pam:** [https://github.com/GoogleCloudPlatform/terraform-google-pam/tree/main](https://github.com/GoogleCloudPlatform/terraform-google-pam/tree/main)

This PAM module was intentionally not included as part of this configuration, as it addresses a different (though related) aspect of access control and is typically implemented separately based on specific operational needs for managing temporary elevation.

## License

This code is licensed under the Apache License, Version 2.0. See the license headers in the `.tf` files for details.