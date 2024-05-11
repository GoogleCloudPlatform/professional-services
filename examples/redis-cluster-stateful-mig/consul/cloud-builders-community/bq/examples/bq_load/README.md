# BQ Load Example

This example demonstrates a build that:

1.  Downloads a sample data file with the `wget` builder.
2.  Loads a local data file to a BigQuery table.

To run this example, make sure you have created a BigQuery table named
`test_dataset`, and assign the [BigQuery Data
Editor](https://cloud.google.com/bigquery/docs/access-control#permissions_and_roles)
role to [your Cloud Build service
account](https://cloud.google.com/cloud-build/docs/securing-builds/set-service-account-permissions)
and run:
```
gcloud builds submit --config=cloudbuild.yaml .
```
