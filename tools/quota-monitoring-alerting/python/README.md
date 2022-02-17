
**NOTE**: This README is for python version of the solution. For Java version please refer
[here](../java/README.md).


## Introduction

Standalone tool with following capabilities
1. Export all quota related metrics to BigQuery.
2. DataStudio dashboard to
  * Visualize quota utilization data at various resource hierarchy levels.
  * Show quota threshold reports(quota's that are exceeding the configured thresholds).
3. Trigger alerts when quota's exceed set threshold(s).


## Demo Dashboard
The Demo dashboard showing the final output is available <a href="https://datastudio.google.com/u/2/reporting/50bdadac-9ea0-4dcd-bee2-f323c968186d/page/xxWVB" target="_blank">here</a>.


## Deployment Guide
#### Common Steps
* Create a project
* Associate billing with the project
* Provide permissions to the user/Service Account(SA) that would deploy the solution.
  > These permissions are only for deploying the solution. The deployment
    creates neccessary service accounts and permissions for the solution to
    operate.
  * Assign the following permissions at org level to the user or service
    account(SA) that would be executing the deployment steps. An admin can create a custom role and assign it to the user/SA by following the example <a href="https://cloud.google.com/iam/docs/creating-custom-roles#creating_a_custom_role" target="_blank">here</a>
    * resourcemanager.organizations.getIamPolicy
    * resourcemanager.organizations.setIamPolicy
  * Assign the following roles at project level to the user or service account that
    would be executing the deployment steps
    * roles/appengine.appCreator
    * roles/appengine.appViewer
    * roles/bigquery.user
    * roles/cloudbuild.builds.editor
    * roles/cloudscheduler.admin
    * roles/iam.serviceAccountCreator
    * roles/iam.serviceAccountDeleter
    * roles/iam.serviceAccountUser
    * roles/pubsub.admin
    * roles/resourcemanager.projectIamAdmin
    * roles/run.developer
    * roles/serviceusage.serviceUsageAdmin
    * roles/storage.admin

#### Deployment steps
Follow the below guide to deploy the solution using terraform
* [Terraform steps](docs/terraform_deploy.README.md)


## Testing Guide
A testing guide with detailed instructions is available
[here](docs/testing_guide.README.md).


## Releases
Detailed release notes are available [here](docs/release_notes.README.md).


## Contact Us
For any comments, issues or feedback, please reach out to us at pso-quota-monitoring@google.com
