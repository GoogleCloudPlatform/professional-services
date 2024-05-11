# Execute OPA query on Deployment Manager configuration

This example executes an OPA query on a [Deployment Manager configuration](https://cloud.google.com/deployment-manager/docs/configuration/create-basic-configuration) to check whether a vm resource is in a particular location.

Note: This example assumes that you have built the `opa` build step and pushed it to
`gcr.io/$PROJECT_ID/opa`.

## Executing the OPA Builder
To run the OPA query, run the following:
```bash
gcloud builds submit . --config=cloudbuild.yaml
```
