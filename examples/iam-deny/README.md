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

# Terraform Google Cloud IAM Deny and Organization Policies

This Terraform configuration demonstrates how to implement a series of security guardrails within a Google Cloud organization. It leverages IAM Deny Policies and Organization Policies to restrict high-privilege permissions and enforce organizational standards.

## Table of Contents

* [Features](#features)
* [Prerequisites](#prerequisites)
* [Installation and Deployment](#installation-and-deployment)
* [Resources Created](#resources-created)
* [Inputs](#inputs)
* [Outputs](#outputs)
* [Providers](#providers)
* [Modules](#modules)
* [Related Modules & Concepts](#related-modules--concepts)
* [Contributing](#contributing)
* [License](#license)

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
*   Restricts specified Google Cloud service usage (e.g., `securitycenter.googleapis.com`, `accessapproval.googleapis.com`) within a designated folder using a standard Organization Policy.

## Prerequisites

1.  **Terraform:** Terraform CLI installed (see `provider.tf` for version constraints).
2.  **Google Cloud Provider Authentication:** Configured authentication for the Terraform Google providers. This is typically done via `gcloud auth application-default login` or by setting the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to a service account key JSON file.
3.  **Required Permissions (Organization Level):** The identity running Terraform needs sufficient permissions. Consider assigning or ensuring the identity has roles like:
    *   **IAM Deny Admin** (`roles/iam.denyAdmin`)
    *   **Organization Policy Administrator** (`roles/orgpolicy.policyAdmin`)
    *   **Tag Admin** (`roles/resourcemanager.tagAdmin`) or **Tag User** (`roles/resourcemanager.tagUser`) for creating and using tags.
    *   **Organization Viewer** (`roles/resourcemanager.organizationViewer`) or **Folder Admin** (`roles/resourcemanager.folderAdmin`)
4.  **Google Cloud Organization ID:** Your numeric Organization ID (e.g., `123456789012`).
5.  **Target Google Cloud Folder ID:** The numeric ID of the specific Google Cloud Folder (e.g., `987654321098`) where folder-level policies will be applied.
6.  **Tag Setup:**
    *   You need to create a suitable tag (e.g., key `iam_deny` with value `enabled`) within your Google Cloud organization that will be used by the organization-level deny policy.
    *   Obtain the specific numeric IDs for the Tag Key (e.g., `tagKeys/123...`) and Tag Value (e.g., `tagValues/456...`).
7.  **Permission Definition Files:** The example JSON files defining permissions for different profiles (`billing.json`, `networking.json`, `securitycenter.json`) are located within the `terraform/profiles/` directory of this example.

## Installation and Deployment

1.  **Clone Repository:** If you haven't already, clone the repository containing this example to your local machine.
    ```bash
    # Example: Replace with the actual repository URL
    git clone https://github.com/GoogleCloudPlatform/terraform-google-iam.git
    cd terraform-google-iam/examples/iam-deny
    ```
2.  **Navigate to Terraform Directory:** Change into the Terraform configuration directory for this example.
    ```bash
    cd terraform
    ```
    *(All subsequent Terraform commands should be run from this `terraform` directory)*

3.  **CRITICAL: Update Tag IDs in `main.tf`**

    This is a **crucial step** for the organization-level deny policy to function correctly.
    *   Open the `main.tf` file.
    *   Locate the `google_iam_deny_policy.top_level_deny` resource (around line 32).
    *   Inside its `denial_condition` block, you **MUST REPLACE** the placeholder tag key ID (`'tagKeys/*'`) and tag value ID (`'tagValues/*'`) in the expression:
        ```terraform
        # Before: expression = "resource.matchTagId('tagKeys/*', 'tagValues/*')"
        # After:  expression = "resource.matchTagId('tagKeys/YOUR_TAG_KEY_ID', 'tagValues/YOUR_TAG_VALUE_ID')"
        ```
        Replace `YOUR_TAG_KEY_ID` and `YOUR_TAG_VALUE_ID` with the actual numeric IDs of the tag key and value you created in the prerequisites.

4.  **Prepare `terraform.tfvars` File:**
    *   Copy the example variables file:
        ```bash
        cp terraform.tfvars.example terraform.tfvars
        ```
    *   Edit the new `terraform.tfvars` file.
    *   **IMPORTANT: Replace all placeholder values** (like `YOUR_ORG_ID`, `YOUR_FOLDER_ID`, and example group emails `...@example.com`) with your actual Organization ID, target Folder ID, and principal/group identifiers for policy exceptions. Refer to the [Inputs](#inputs) section for details on each variable.

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

*   **`google_iam_deny_policy.top_level_deny`**: An IAM Deny Policy attached at the organization level. It denies a broad set of administrative permissions (defined in `denied_perms.tf`) on any resource tagged with the specific tag you configured in `main.tf`.
*   **`google_iam_deny_policy.profile-deny-policy`**: An IAM Deny Policy attached at the folder level (specified by `var.folder_id`). It denies specific Billing, Security, and Networking permissions on resources within that folder *unless* those resources have *any* tag applied to them. The specific sets of permissions for these profiles are defined in JSON files within the `./terraform/profiles/` directory (e.g., `billing.json`, `networking.json`, `securitycenter.json`). This structure allows for clear organization of denied permissions and the application of distinct exception principals for each functional area.
*   **`google_org_policy_custom_constraint.deny_owner`**: A Custom Organization Policy Constraint defined at the organization level. This constraint (`custom.denyOwner`) specifies a condition to deny the assignment of the primitive `roles/owner` role.
*   **`google_org_policy_policy.enforce_deny_owner_constraint`**: An Organization Policy that enforces the `custom.denyOwner` constraint at the organization level.
*   **`module "gcp_org_policy_v2"` (Resource: `google_org_policy_policy`):** This module creates an Organization Policy attached at the folder level (specified by `var.folder_id`). It enforces the `gcp.restrictServiceUsage` constraint to deny the usage of specified services (e.g., `securitycenter.googleapis.com`, `accessapproval.googleapis.com`) within that folder.

## Inputs

| Name                            | Description                                                                                                                               | Type         | Default                                      | Required |
|---------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|--------------|----------------------------------------------|:--------:|
| `org_id`                        | Your Google Cloud Organization ID (numeric string). **Must be set in `terraform.tfvars`.**                                                                 | `string`     | `""` (Effectively N/A - Must be provided)  |   Yes    |
| `folder_id`                     | The folder ID (numeric string, without "folders/" prefix) where folder-level policies will be attached. **Must be set in `terraform.tfvars`.**                                         | `string`     | `""` (Effectively N/A - Must be provided)  |   Yes    |
| `networking_exception_principals` | List of principals exempt from the networking deny rule. Example format: `principalSet://goog/group/GROUP_EMAIL_ADDRESS`. See [IAM Principals](https://cloud.google.com/iam/docs/principal-identifiers). | `list(string)` | `[]`                                         |    No    |
| `billing_exception_principals`  | List of principals exempt from the billing deny rule.                                                                                           | `list(string)` | `[]`                                         |    No    |
| `sec_exception_principals`      | List of principals exempt from the security deny rule.                                                                                          | `list(string)` | `[]`                                         |    No    |
| `top_exception_principals`      | List of principals exempt from the organization-level deny policy.                                                                              | `list(string)` | `[]`                                         |    No    |
| `folder_path`                   | The prefix for the folder resource path used in IAM policies.                                                                                                  | `string`     | `"cloudresourcemanager.googleapis.com/folders/"` |    No    |
| `region`                        | The default Google Cloud region for the provider.                                                                                         | `string`     | `"us-central1"`                              |    No    |
| `zone`                          | The default Google Cloud zone for the provider.                                                                                           | `string`     | `"us-central1-c"`                            |    No    |

**Important Note on `terraform.tfvars`:** The `terraform.tfvars.example` file provides the structure for your `terraform.tfvars` file. You **must** update `org_id`, `folder_id`, and any desired exception principals in `terraform.tfvars` before applying the configuration. The default empty string `""` for `org_id` and `folder_id` in the table above are placeholders in the variable definitions; they will cause errors if not overridden. Exception principal lists default to empty `[]` if not specified, meaning no exceptions by default.

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

This PAM module is separate and addresses a different aspect of access control, typically implemented based on specific operational needs for managing temporary elevation.

## Contributing

Contributions are welcome! Please refer to the main repository's contributing guidelines for more information.

## License

Licensed under the Apache License, Version 2.0. See the [LICENSE](../../../LICENSE) file for the full license text.
(Note: Adjust the path to the main LICENSE file if this example is moved).