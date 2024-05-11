# CFT GCE Build

This build creates a GCE instance by executing `cft` command.

Note: This example assumes that you have built the `cft` build step and pushed it to
`gcr.io/$PROJECT_ID/cft`.

## Executing the CFT Builder
Make sure you have assigned the [Deployment Manager
Editor](https://cloud.google.com/iam/docs/understanding-roles#deployment_manager_roles)
role to the [Cloud Build service
account](https://cloud.google.com/cloud-build/docs/securing-builds/set-service-account-permissions).
```bash
export PROJECT=$(gcloud info --format='value(config.project)')
export MEMBER=$(gcloud projects describe $PROJECT --format 'value(projectNumber)')@cloudbuild.gserviceaccount.com
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$MEMBER --role='roles/deploymentmanager.editor'
```

To create the resource using CFT, run the following:
```bash
gcloud builds submit . --config=cloudbuild.yaml
```

To clean up the resource using CFT, run the following:
```bash
gcloud builds submit . --config=cloudbuild-delete.yaml
```