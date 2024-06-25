# Airflow DAGs Integrity Test

This build executes a unit test that verifies the DAGs integrity.

Note: This example assumes that you have built the `airflow` build step and pushed it to
`gcr.io/$PROJECT_ID/airflow`.

## Executing the Airflow Builder

To run the DAGs integrity test, run the following:
```bash
gcloud builds submit . --config=cloudbuild.yaml
```
