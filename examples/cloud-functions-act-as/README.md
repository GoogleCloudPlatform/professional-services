# Cloud Function "Act As" Caller

> tl;dr The Terraform project in this repository deploys a single simple Python Cloud Function that executes a simple action against Google Cloud API using identity of the function caller illustrating the full flow described above.

---

This example describes one possible solution of reducing the set of Google Cloud IAM permissions required by a Service Account running a Google Cloud Function by executing the Cloud Function on behalf of and with IAM permissions of the caller identity.

Often the Google Cloud Functions are used for automation tasks, e.g. cloud infrastrcuture automation. In big Google Cloud organizations such automation needs access to all organization tenants and because of that the Cloud Function Service Account needs wide scope IAM permissions at the organization or similar level.

Following the Principle of Least Privilege the Service Account that the Cloud Function executes under needs to have only IAM permissions required for its successful execution. In the case when a common Cloud Function automation is called by multiple tenants for performing operations on their individual tenant Google Cloud resources it would only require IAM permissions to the GCP resources of that tenant at a time. Those are typically permissions that the tenant is already having or can obtain for its tenant Service Accounts or Workload Identity.

This example illustrates a possible approach of reducing the set of Cloud Function IAM permissions to the temporary set of permissions defined by the context of the Cloud Function caller and its identity in particular. 

The example contains a solution for the GitHub based CI/CD workflow caller of a Google Cloud Function based on the Workload Idenitty Federation mechanism supported by GitHub and [google-github-actions/auth](https://github.com/google-github-actions/auth) GitHub Action.

The Terraform project in this repository deploys a single simple Python Cloud Function that executes a simple action against Google Cloud API using identity of the function caller illustrating the full flow described above.


## Caller Workload Identity

One of the typical security concerns in Cloud SaaS based CI/CD pipelines that manage and manipulate Google Cloud resources is the need to securely authenticate the caller process on the Google Cloud side. 

A typical way of authenticating is using Google Cloud Serivce Account keys stored on the caller side that effectively are being used as long lived client secrets that need to be protected and kept in secret. The need to manage and protect the long lived Service Account keys is a security challenge for the client.

The recommended way to improve the secruity posture of the CI/CD automation is to remove the need to authenticate with Google Cloud using Service Account keys altogether. The Workload Identity Federation is the mechanism that allows secure authentication with no long lived secrets managed by the client based on the Open ID Connect authentication flow.

The following diagram describes the authentication process that does not require Google Cloud Service Account key management on the client side.

![Workflow Identity Federation Authentication](images/wif-authentication.png?raw=true "Workflow Identity Federation Authentication")

## Solution

The Cloud Function Service Account is not granted any IAM permissions in the tenant GCP project. The only permissions it requires is read access to the ephemeal temporary Google Secret Manager Secret resource in its own project where the Cloud Function is defined and running.

The Caller is the GitHub Runner that executes the GitHub Workflow defined in this source repository in the [.github/workflows/call-function.yml](./.github/workflows/call-function.yml) file. It authenticates to GCP as a Workload Identity using Workflow Identity Fedederation set up by the Terraform project in this repository.

The Service Account "mapped" to the Workload Identity of the GitHub Workflow run has needed read/write permissions to the GCP resources that the Cloud Function needs to manipulate.

There are several variations possible in regards to the location of the ephemeral secrets to be stored (application project vs central automation project).

### Simple Invocation

The following diagram shows the simplest case of the Cloud Function invocation in which the GCP access token gets passed in the call to the Cloud Function, e.g. in its payload or better HTTP header.

![Invocation with the secret in the application project](images/cf-act-as0.png?raw=true "Invocation with the secret in the application project")

1. The GitHub Workflow (the Caller) authenticates to the GCP using the [google-github-actions/auth](https://github.com/google-github-actions/auth) GitHub Action. After this step the GitHub Workflow has short lived GCP access token available to the subsequent workflow steps to execute and connect to the GCP to call the Cloud Function.
2. The Caller passes the GCP access token obtained on the previous step in the Cloud Function invocation HTTPS request payload or header.
3. The Cloud Function authenticates to the Google API using the access token extracted from the Secret Manager Secret on the previous step and accesses the target GCP resource on behalf and with IAM permissions of the Caller.

### Invocation with Secret

In some cases, such as when the logic represented by a Cloud Function is implemented by several components, such as Cloud Functions chained together, it would be needed to pass the caller's access token between those components securely. In that situation it is preferrable to apply a [Claim Check pattern](https://www.enterpriseintegrationpatterns.com/StoreInLibrary.html) and pass the resource name of the secret containing the access token between the solution components as it is illustrated in the following diagram.

![Invocation with the secret in the application project](images/cf-act-as3.png?raw=true "Invocation with the secret in the application project")

1. The GitHub Workflow (the Caller) authenticates to the GCP using the [google-github-actions/auth](https://github.com/google-github-actions/auth) GitHub Action. After this step the GitHub Workflow has short lived GCP access token available to the subsequent workflow steps to execute and connect to the GCP to call the Cloud Function.
2. The Caller passes the GCP access token obtained on the previous step in the Cloud Function invocation HTTPS request payload or header.
3. The first Cloud Function extracts the GCP access token obtained on the previous step from the incoming message payload and stores it in an ephemeral Secret Manager Secret in the central project location.
4. The Cloud Function extracts the access token from the ephemeral Secret Manager Secret
5. The Cloud Function authenticates to the Google API using the access token extracted from the Secret Manager Secret on the previous step and accesses the target GCP resource on behalf and with IAM permissions of the Caller.
6. (Optionally) The Cloud Function drops the ephemeral Secret Manager Secret resource.
7. (Optionally) The Caller double checks and drops the ephemeral Secret Manager Secret resource.

## Service Accounts and IAM Permissions

This project creates two GCP Service Accounts:
* Cloud Function Service Account – replaces the default Cloud Function [runtime service account](https://cloud.google.com/functions/docs/securing/function-identity#runtime_service_account) with an explicit customer managed service account
* Workload Identity Service Account – the GCP service account that represents the external GitHub Workload Identity. When the GitHub workflow authenticates to the GCP it is this service account's IAM permissions that the GitHub Workload Identity is granted.

| Service Account     | Role                                        | Description                                       |
|---------------------|---------------------------------------------|---------------------------------------------------|
| `cf-sample-account` | `roles/secretmanager.secretVersionManager`  | To create the Secret Manager secret for access token for the "Invocation with central secret" case |
|                     | `roles/secretmanager.secretAccessor`        | To read the access token from Secret Manager secret  |
| `wi-sample-account` | `roles/secretmanager.secretVersionManager`  | To create the Secret Manager secret for access token for the "Invocation with application owned secret" case |
|                     |                                             | To store the access token in the Secret Manager secret in the "Invocation with application owned secret" case |
|                     | `roles/iam.workloadIdentityUser`            | Maps the external GitHub Workload Identity to the Workload Identity Service Account |
|                     | `roles/cloudfunctions.developer`            | `cloudfunctions.functions.call` permission to invoke the sample Cloud Function  |
|                     | `roles/viewer`                              | Sample IAM permissions to list GCE VM instances granted to the Workload Identity Service Account but not to the Cloud Function Service Account  |


## Deployment

The Terraform project in this repository defines the following input variables that can either be edited in the `variables.tf` file directly or passed over the Terraform command line.

| Name          | Description                                     |
|---------------|-------------------------------------------------|
| `project_id`  | Target GCP project id. All resources will be deployed here.  |
| `project_number`  | Target GCP project number.                  |
| `location`    | The name of the GCP region to deploy resources  |
| `zone`        | The GCP Zone for the sample Cloud Function to list GCE VM instances in                                     |
| `github_repo`  | The name of the GitHub repository in the format `organization/repository`.                                |
| `github_ref`  | The git reference to the source code repository. Usually a reference to the branch which is getting built  |

To deploy the example with Cloud Function and all required GCP components including Workload Idepntity Pool and Provider use the usual
```
terraform init
terraform plan
terraform apply
```

in the root folder of this repository.

The project deploys the GCP resources by default into the `europe-west3` region. You can change that by passing alternative value to the `location`  input variable by copying the `terraform.tfvars.sample` to the `terraform.tfvars` file and updating values there.


## Call Function

After the example is provisioned through Terraform, you can test and call the deployed function from the command line with gcloud
```
gcloud functions call sample-function --region=${REGION} --data '{}'
```

The sample Cloud Function calls Google Compute Engine API v1 and [lists](https://cloud.google.com/compute/docs/reference/rest/v1/instances/list) Google Compte Engine instances in the specified region.

The Cloud Function deployed by this project runs as `cf-sample-account@${PROJECT_ID}.iam.gserviceaccount.com` service account.
This service account doesn't have any granted permissions in GCP except for the read access to the Secret Manager Secret. Hence, the Cloud Function cannot reach the GCE API and list the VMs by default.

For this action to successfully complete from the command line as illustrated above, the Cloud Function service
account `cf-sample-account@${PROJECT_ID}.iam.gserviceaccount.com` needs to have `compute.instances.list` permission in the target GCP project.

If the execution succeeds, the command line output will be similar to the following
```
$ gcloud functions call sample-function --region=${REGION} --data '{}'

executionId: 84e2bkg5717v
result: ', jumpbox (https://www.googleapis.com/compute/v1/projects/${PROJECT_ID}/zones/europe-west3-c/machineTypes/e2-micro)'
```

## GitHub Workflow

The sample GitHub [workflow](.github/workflows/call-function.yml) in this repository illustrates the way of calling the sample Cloud Function from a GitHub workflow.

For the workflow to succeed, a dedicated service account `wi-sample-account` is mapped to the authenticated GitHub Workload Identity. It needs to have `cloudfunctions.functions.call` permission for the deployed Sample Cloud Function in order to be able to invoke it. The `roles/cloudfunctions.developer` built-in role grants that permission.


## Running Example

Copy `terraform.tfvar.sample` file to `terraform.tfvar` and adjust settings inside for your project, location, etc.

Deploy the GCP resources with Terraform:
```
terraform init
terraform plan
terraform apply
```

To invoke the Cloud Function on behalf of the GitHub workload idenity, it is needed to create GitHub Actions workflow from the `.github/workflows/call-function.yml` file. Copy this file with relative folders to the root of your GitHub repository for GitHub to pick up the workflow.

Please note that the GitHub workflow reads the parameters during the run from the `terraform.tfvars.sample` file in the root repository folder. You'd need to either modify the workflow file or check in correct values to the `terraform.tfvars.sample` file.

After the GCP resources are provisioned, and given that the parameters in the `terraform.tfvars.sample` are correct, the GitHub Actions run should succeed. It is the [last step](.github/workflows/call-function.yml#L68) is the sample Cloud Function call. 
This is because the Workload Identity Service Account that the project associates with the GitHub identity has permissions to list GCE VM instances, which is what the sample Python Cloud Function is doing.

At this point it is now possible to ensure that the direct Cloud Function invocation, e.g. using an interactive user account, with no access token supplied, fails because the Cloud Function Service Account itself does not have permissions to list GCE VM instances:
```
gcloud functions call sample-function --region=${REGION} --data '{}'
```
That call should fail no matter which permissions for GCE your current user account is having:
```
result: "Error: <HttpError 403 when requesting https://compute.googleapis.com/compute/v1/projects/$PROJECT_ID/zones/$ZONE/instances?alt=json\
  \ returned \"Required 'compute.instances.list' permission for 'projects/$PROJECT_ID'\"\
  . Details: \"[{'message': \"Required 'compute.instances.list' permission for 'projects/$PROJECT_ID'\"\
  , 'domain': 'global', 'reason': 'forbidden'}]\">"
```

Now you can try to pass the access token that represents an account that has GCE VM instances list permissions. E.g. if your current user account has that permission:
```
gcloud functions call sample-function --region=${REGION} --data "{ \"access_token\": \"$(gcloud auth print-access-token)\" }"
```
This time the call should succeed and show the list of GCE VMs, e.g.
```
executionId: 76wkh0r8yhjf
result: 'jumpbox'
```

Alternatively, you can pass the access token via Secret Manager Secret in the same way as GitHub workflow does.

Save the access token to the Secret Manager Secret created by this Terraform project and pass the Secret Manager secret resource name in the call to the sample Cloud Function instead of the access token:
```
gcloud functions call sample-function --region=${REGION} \
    --data "{ \"secret_resource\": \"$(echo -n $(gcloud auth print-access-token) | \
    gcloud secrets versions add access-token-secret --data-file=- --format json | \
    jq -r .name)\" }"
```

This call should succeed as well. The sample Cloud Function will extract the access token of the current user account from the Secret Manager secret and call GCE API provding that access token for authentication.

## Cleaning up

To avoid incurring charges to your Google Cloud account for the resources used in this tutorial, you can use Terraform to delete most of the resources. If you 
created a new project for deploying the resources, you can also delete the entire project.

To delete resources using Terraform, run the following command:

    terraform destroy

To delete the project, do the following:

1.  In the Cloud Console, go to the [Projects page](https://console.cloud.google.com/iam-admin/projects).
1.  In the project list, select the project you want to delete and click **Delete**.
1.  In the dialog, type the project ID, and then click **Shut down** to delete the project.
---


## Useful Commands

### Read current access token using gcloud

[Getting the access token using gcloud](https://cloud.google.com/sdk/gcloud/reference/auth/application-default/print-access-token)

```
gcloud auth application-default print-access-token 
```

### Store access token in Secret Manager
```
echo -n "$(gcloud auth print-access-token)" | \
    gcloud secrets versions add access-token-secret --data-file=-
```

### Develop and Debugg the Cloud Function locally 
Within the [function](./function) folder run following commds to start the function framework locally:
```
pip install -r requirements.txt
functions-framework --target main --debug
```