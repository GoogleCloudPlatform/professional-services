# VPC Flow logs enforcement via Cloud Function

## Description

This sample code shows how a Cloud Function can be used to enforce VPC Flow logs in all the networks under a particular folder. The Cloud Function will listen on a Pub/Sub topic for notifications about changes in subnets. The notifications can be configured in two ways:

1. By creating a log sink that will filter all the network change events under the chosen folders and send them to a Pub Sub topic. This can be enabled using the `configure_log_sinks` variable.
2. By creating Cloud Asset Inventory feeds that will send notifications to a Pub Sub topic when a subnet is modified under a particular folder. This can be enabled using the `configure_asset_feeds` variable. Currently, the Cloud Asset Inventory feeds cannot be configured via Terraform. The terraform configuration will create shell scripts to create and delete the feeds.

You should only enable one of the two options to avoid duplicate operations. If you enable both, you will see that the Asset Inventory notifications are received a few seconds before the Cloud Monitoring (Stackdriver) based ones. You will probably want to use these in production, but I have included both options for demonstration purposes.

The Terraform code included in this example creates the following resources:

* A GCP project where all the resources will be located.
* A Pub/Sub topic where the subnet change events will be published by the log sink or the inventory feed.
* A Cloud Function that listens to subnet change notifications and makes sure VPC flow logs are activated.
* If configured to do so, it will create the log sinks that will send notifications each time a subnet is modified.
* If configured to do so, it will create the asset inventory feeds that will send notifications each time a subnet is modified.
* Creates all the necessary permissions:
  * For the Cloud Function to be able to modify the subnets under the folders being monitored.
  * For the log sink service accounts to publish notifications in the Pub Sub topic.
  * For the Cloud Asset Inventory service account to publish notifications in the Pub Sub topic.

## Setup instructions

This terraform code uses service account impersonation to authenticate in the GCP APIs. The reasons for this are:

1. It is recommended to only grant high level permissions to one service account, and allow impersonating this SA to specific users who will need to run the terraform code. This way individual users will not need to have excessive permissions.
2. By always using a service account it is simpler to configure fine-grained permissions to run terraform code.
3. By using impersonation instead of just a service account key we eliminate the private key exfiltration risk.
4. By using impersonation instead of just a service account key we can see in the logs who executed the terraform code, even if the authentication was made via a SA key (the `serviceAccountDelegationInfo` attribute in the logs contain the email of the user who impersonated the SA).

In order to run this terraform code, you will need to:

1. Create a service account in the main project and grant it the necessary permissions. You will need:
  * If using CAI feeds, you will need the Cloud Asset Viewer role at the organization level, or above the folders you want to monitor.
  * If using log sinks, you will need the Logs Configuration Writer role at the organization level, or above the folders you want to monitor.
  * Project Creator and Billing account User roles, if you want to create the project using terraform. If you are using an existing project, you will need to grant the service account the project Editor or Owner role.
2. Identify the team members who will need to run the terraform code, and grant them the `roles/iam.serviceAccountTokenCreator` role.
3. Edit the `terraform.tfvars` files and replace the value of the `terraform_service_account` variable with the email of your service account.

The setup is quite straightforward:

1. Decide which which folders in your organization you want to enforce VPC flow logs and take note of those folder IDs.
2. Choose a name for your demo project and a folder where you want to place it.
3. Decide on the VPC flow logs configuration you want to apply to your networks. See [here](https://cloud.google.com/compute/docs/reference/rest/v1/subnetworks) for the options.
4. Decide if you want to use asset inventory feeds or log sinks for the subnet change notifications.
5. Edit the `terraform.tf` file with your configuration options.
6. Apply the terraform configuration.
7. If you chose to use asset inventory feeds, make sure you run terraform using a service account. The Cloud Asset Inventory API requires being invoked using a service account.

## Testing locally

You can test the cloud function locally using the sample logs provided. To do this, you will first need to configure your python environment. While in this folder (vpc_log_enforcer), use [virtualenv](https://virtualenv.pypa.io/en/latest/) to set up a python3 environment:

```
virtualenv --python python3 env
source env/bin/activate
pip3 install -r terraform/templates/cloud_function/requirements.txt
```

Run the cloud function using any of the sample logs provided (or create your own):

```
python3 terraform/templates/cloud_function/main.py sample_logs/insert_subnet_call_last.json
```

sample output:

```
reading sample message from: sample_logs/insert_subnet_call_last.json
/Users/alpalacios/Workspaces/RNLT/PSO_Repo/vpc_log_enforcer/env/lib/python3.6/site-packages/google/auth/_default.py:69: UserWarning: Your application has authenticated using end user credentials from Google Cloud SDK. We recommend that most server applications use service accounts instead. If your application continues to use end user credentials from Cloud SDK, you might receive a "quota exceeded" or "API not enabled" error. For more information about service accounts, see https://cloud.google.com/docs/authentication/
  warnings.warn(_CLOUD_SDK_CREDENTIALS_WARNING)
got subnet change notification from stackdriver
enabling flow logs in subnetwork /projects/apszaz-crf-minutis-prod/regions/europe-west4/subnetworks/dummy.
flow logs successfully enabled in subnetwork /projects/apszaz-crf-minutis-prod/regions/europe-west4/subnetworks/dummy.
```
