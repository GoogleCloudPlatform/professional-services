## Introduction

Standalone tool with following capabilities
1. Export all quota related metrics to BigQuery.
2. DataStudio dashboard to
  * Vizualize quota utilization data at various resource hierarchy levels.
  * Show quota threshold reports(quota's that are exceeding the configured thresholds).
3. Trigger alerts when quota's exceed set thresholds.


**NOTE**: This README is for python version of the solution. For Java version please refer
[here](../java/README.md).


## Demo Dashboard
The Demo dashboard showing the final output is available <a href="https://datastudio.google.com/u/2/reporting/50bdadac-9ea0-4dcd-bee2-f323c968186d/page/xxWVB" target="_blank">here</a>.


## Deployment Guide
#### Common Steps
* Create a project
* Associate billing with the project
* Assign the following permissions to the user or service account at the org
  level for executing the deployment steps
  > These permissions are only for deploying the solution. The deployment
    creates neccessary service accounts and permissions for the solution to
    operate.
  * Editor
  * App Engine Creator
  * resourcemanager.organizations.getIamPolicy
  * resourcemanager.organizations.setIamPolicy
  * resourcemanager.projects.setIamPolicy

#### Deployment steps
Follow one of the below options for deploying the solution.
  * [Terraform steps](docs/terraform_deploy.README.md)
  * [Manual steps](docs/manual_deploy.README.md)


## Testing Guide
A testing guide with detailed instructions is available
[here](docs/testing_guide.README.md).


## Releases
Detailed release notes are available [here](docs/release_notes.README.md).


## Contact Us
For any comments, issues or feedback, please reach out to us at pso-quota-monitoring@google.com
