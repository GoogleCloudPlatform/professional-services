# Configuring Workload Identity Federation to access Google Cloud resources from apps running on Azure

The most straightforward way for workloads running outside of Google Cloud to call Google Cloud APIs is by using a downloaded service account key. However, this approach has 2 major pain points:

* A management hassle,  keys need to be stored securely and rotated often.
* A security risk, keys are long term credentials that could be compromised.

Workload identity federation enables applications running outside of Google Cloud to replace long-lived service account keys with short-lived access tokens. This is achieved by configuring Google Cloud to trust an external identity provider, so applications can use the credentials issued by the external identity provider to impersonate a service account.

This blueprint shows how to set up everything, both in Azure and Google Cloud, so a workload in Azure can access Google Cloud resources without a service account key. This will be possible by configuring workload identity federation to trust access tokens generated for a specific application in an Azure Active Directory (AAD) tenant.

The following diagram illustrates how the VM will get a short-lived access token and use it to access a resource:

 ![Sequence diagram](sequence_diagram.png)

The provided terraform configuration will set up the following architecture:

 ![Architecture](architecture.png)

* On Azure:

  * An Azure Active Directory application and a service principal. By default, the new application grants all users in the Azure AD tenant permission to obtain access tokens. So an app role assignment will be required to restrict which identities can obtain access tokens for the application.

  * Optionally, all the resources required to have a VM configured to run with a system-assigned managed identity and accessible via SSH on a public IP using public key authentication, so we can log in to the machine and run the `gcloud` command to verify that everything works as expected.

* On Google Cloud:

  * A Google Cloud project with:

    * A workload identity pool and provider configured to trust the AAD application

    * A service account with the Viewer role granted on the project. The external identities in the workload identity pool would be assigned the Workload Identity User role on that service account.

## Running the blueprint

Clone this repository or [open it in cloud shell](https://ssh.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2Fterraform-google-modules%2Fcloud-foundation-fabric&cloudshell_print=cloud-shell-readme.txt&cloudshell_working_dir=blueprints%2Fcloud-operations%2Fworkload-identity-federation), then go through the following steps to create resources:

* `terraform init`
* `terraform apply -var project_id=my-project-id`

## Testing the blueprint

Once the resources have been created, do the following to verify that everything works as expected:

1. Log in to the VM.

    If you have created the VM using this terraform configuration proceed the following way:

    * Copy the public IP address of the Azure VM and the username required to log in to the VM via SSH from the output.

    * Save the private key to a file

        `terraform state pull | jq -r '.outputs.tls_private_key.value' > private_key.pem`

    * Change the permissions on the private key file to 600

        `chmod 600 private_key.pem`

    * Login to the Azure VM using the following command:

        `ssh -i private_key.pem azureuser@VM_PUBLIC_IP`

    If you already had an existing VM with the gcloud CLI installed that you want to use, you will have assign its managed identity an application role as explained [here](https://docs.microsoft.com/en-us/azure/active-directory/managed-identities-azure-resources/how-to-assign-app-role-managed-identity-powershell#assign-a-managed-identity-access-to-another-applications-app-role).

2. Create a file called credential.json in the VM with the contents of the `credential` output.

3. Authorize gcloud to access Google Cloud with the credentials file created in the step before.

    `gcloud auth login --cred-file credential.json

4. Get the Google Cloud project details

    `gcloud projects describe PROJECT_ID`

Once done testing, you can clean up resources by running `terraform destroy`.
<!-- BEGIN TFDOC -->

## Variables

| name | description | type | required | default |
|---|---|:---:|:---:|:---:|
| [project_id](variables.tf#L26) | Identifier of the project that will contain the Pub/Sub topic that will be created from Azure and the service account that will be impersonated. | <code>string</code> | ✓ |  |
| [project_create](variables.tf#L17) | Parameters for the creation of the new project. | <code title="object&#40;&#123;&#10;  billing_account_id &#61; string&#10;  parent             &#61; string&#10;&#125;&#41;">object&#40;&#123;&#8230;&#125;&#41;</code> |  | <code>null</code> |
| [vm_test](variables.tf#L31) | Flag indicating whether the infrastructure required to test that everything works should be created in Azure. | <code>bool</code> |  | <code>false</code> |

## Outputs

| name | description | sensitive |
|---|---|:---:|
| [credential](outputs.tf#L17) | Credential configuration file contents. |  |
| [tls_private_key](outputs.tf#L28) | Private key required to log in to the Azure VM via SSH. | ✓ |
| [username](outputs.tf#L34) | Username required to log in to the Azure VM via SSH. |  |
| [vm_public_ip_address](outputs.tf#L39) | Azure VM public IP address. |  |

<!-- END TFDOC -->
