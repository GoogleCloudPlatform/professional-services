# Airflow

This build step provides [`airflow`](https://airflow.apache.org/) environment in [Google Cloud Build](https://cloud.google.com/cloud-build).

>Airflow is a platform created by community to programmatically author, schedule and monitor workflows.

## Examples

You can run an example by running the following command inside the `examples` directory:

    $ gcloud builds submit . --config=cloudbuild.yaml

## Building this builder

To build this builder, run the following command in this directory.

    $ gcloud builds submit . --config=cloudbuild.yaml

## Updating the version

To update the version you will need to change the `cloudbuild.yaml` in the `_AIRFLOW_VERSION` part.