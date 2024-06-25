# BQ Query Example

This example demonstrates a build that:

-   Runs a BigQuery query and writes the results to a destination table.

To run this example, make sure you have created a BigQuery table named
`test_dataset`, and assign the [BigQuery Data
Editor](https://cloud.google.com/bigquery/docs/access-control#permissions_and_roles)
role to [your Cloud Build service
account](https://cloud.google.com/cloud-build/docs/securing-builds/set-service-account-permissions)
and run:
```
gcloud builds submit --config=cloudbuild.yaml .
```
