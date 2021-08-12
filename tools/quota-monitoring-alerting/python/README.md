## Introduction

Standalone tool with following capabilities
1. Export all quota related metrics to BigQuery.
2. DataStudio dashboard to
  * Visualize quota utilization data at various resource hierarchy levels.
  * Show quota threshold reports(quota's that are exceeding the configured thresholds).
3. Trigger alerts when quota's exceed set thresholds.


This README is for python version of the solution. For Java version please refer
[here](../java/README.md).


## Deployment Steps

#### Common Steps
* Create a project
* Associate billing with the project
* Make sure the user or service account executing below steps has following permissions at org level
  * Editor
  * App Engine Creator
  * resourcemanager.organizations.getIamPolicy
  * resourcemanager.organizations.setIamPolicy
  * resourcemanager.projects.setIamPolicy
* Follow one of the options for deploying the solution.
  * [Manual steps](docs/manual_deploy.README.md)
  * [Terraform steps](docs/terraform_deploy.README.md)


## Testing
After the solution is successfully deployed, navigate to CloudScheduler console
to test the solution.

* Click 'Run Now' to execute the jobs.
* First execute 'quota-export-job' and wait for it to finish.
* After the above job finishes, execute the second job 'quota-export-report-job'.
  <img src="docs/scheduler.png" align="center" />
* Navigate to the DataStudio dashboard.
* You should see latest utilization data on the dashboard.
  <img src="docs/utilization.png" align="center" />
* Thresholds report should show the latest report on the dashboard.
  <img src="docs/threshold.png" align="center" />
* If there are any quotas that are exceeding set threshold, you should have also received a
notification as well.
  <img src="docs/alert.png" align="center" />

<br />

## Contact Us
For any comments, issues or feedback, please reach out to us at pso-quota-monitoring@google.com
