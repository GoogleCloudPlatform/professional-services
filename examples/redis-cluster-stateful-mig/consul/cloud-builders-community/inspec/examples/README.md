# InSpec GCP Resources

This build executes an InSpec profile for GCP that depends on the 
[InSpec GCP Resource Pack](https://github.com/inspec/inspec-gcp).

Note: This example assumes that you have built the `inspec` build step and pushed it to
`gcr.io/$PROJECT_ID/inspec`.

## Executing the InSpec Builder
Make sure you have assigned the [Compute Network Viewer](https://cloud.google.com/compute/docs/access/iam#network_viewer_role)
role to the [Cloud Build service
account](https://cloud.google.com/cloud-build/docs/securing-builds/set-service-account-permissions).
```bash
export PROJECT=$(gcloud info --format='value(config.project)')
export PROJECT_ID=$(gcloud projects describe $PROJECT --format 'value(projectId)')
export MEMBER=$(gcloud projects describe $PROJECT --format 'value(projectNumber)')@cloudbuild.gserviceaccount.com
gcloud projects add-iam-policy-binding $PROJECT --member=serviceAccount:$MEMBER --role='roles/compute.networkViewer'
```

Update `test-profile/attributes.yml` to point to your GCP project
```bash
sed -i 's/my-gcp-project/'"$PROJECT_ID"'/g' test-profile/attributes.yml 
```

To run the InSpec profile, run the following:
```bash
gcloud builds submit . --config=cloudbuild.yaml
```
