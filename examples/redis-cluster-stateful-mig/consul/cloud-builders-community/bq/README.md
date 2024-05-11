# bq

This is a tool builder to simply invoke
[`bq`](https://cloud.google.com/bigquery/docs/bq-command-line-tool) commands.

Arguments passed to this builder will be passed to `bq` directly, allowing
callers to run [any `bq`
command](https://cloud.google.com/bigquery/docs/bq-command-line-tool).

When executed in the Cloud Build environment, commands are executed with
credentials of the [builder service
account](https://cloud.google.com/cloud-build/docs/permissions) for the
project.

The latest available version of `bq` is used.

## Examples

The following examples demonstrate build request that use this builder:

For these to work, the builder service account must have [permission to
create tables](https://cloud.google.com/bigquery/docs/access-control) on the
test dataset.

### Load a BigQuery table from a local file

This `cloudbuild.yaml` invokes `bq load` to load a table from a file in the
build's workspace.

```
steps:
- name: gcr.io/community-builders/bq
  args: ['load', 'my_dataset.my_table', 'local-file.csv', 'local-schema.json']
```

### Save query results to destination table

This `cloudbuild.yaml` invokes `bq query` to run a query and write results to
a BigQuery table.

```
steps:
- name: gcr.io/community-builders/bq
  args:
  - query
  - --use_legacy_sql=false
  - --destination_table=test_dataset.bobs_from_builder
  - >
    SELECT SUM(number) AS total_bobs, year
    FROM `bigquery-public-data.usa_names.usa_1910_current`
    WHERE name = 'Bob'
    GROUP BY year
```

## Building this builder

To build and test this builder the [builder service
account](https://cloud.google.com/cloud-build/docs/permissions) must
have permissions to create BigQuery query jobs for the project, such as with
the [BigQuery User
Role](https://cloud.google.com/bigquery/docs/access-control#permissions_and_roles).
