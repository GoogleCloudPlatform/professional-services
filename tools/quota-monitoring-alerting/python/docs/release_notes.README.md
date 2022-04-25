## Release Notes

#### V1.2
* Add ability to specify folders and other filters when deploying the solution.
* This change closes the last major feature gap(folder level scanning) between
  Python and Java versions of the solution. At the same time gives more
  configuration flexibility when compared to Java version.
* Add 'Top 10 quota metrics with highest usage' chart to
  [dashboard](https://datastudio.google.com/u/2/reporting/50bdadac-9ea0-4dcd-bee2-f323c968186d/page/xxWVB)

#### V1.1
* Update README to mention detailed permissions instead of editor role.
* Update terraform code to not be authoritative for project level permissions.
  * This will fix some of the customer concerns like - all previously applied IAM policies on the project level are wipped out.
* Add cloudbuild.yaml

#### V1
* Deployment of solution at org level
* Cloud Run as execution environment
* Reporting
  * Utilization Report
  * Threshold Report
  * All Quotas Report
* Alerting
  * Email
* Deployment
  * Manaual deployment steps
  * Terraform deployment steps
* Demo dashboard with sensitive details masked

---
[Back to top level README](../README.md)
