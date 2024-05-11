# Packer GCE build

This directory contains an example that creates a GCE image using HashiCorp Packer.

Example Packer build is using [HCL2 syntax](https://developer.hashicorp.com/packer/guides/hcl) and creates
GCE image basing on Ubuntu Linux.

**Note**: This example assumes that you have built the `packer` build step and pushed it to
`gcr.io/$PROJECT_ID/packer`.
It also assumes that `default` VPC network exists and firewall allows SSH ingress traffic.

## Configuring Service Account for Packer

Below steps create an example Packer service account using `gcloud`.
Cloud Build will [impersonate Packer's service account](https://cloud.google.com/iam/docs/impersonating-service-accounts)
to run Packer acting as a given service account.

1. Set GCP project variables. Substitute `my-project` with your project identifier.

   ```sh
   export PROJECT_ID=my-project
   export PROJECT_NUMBER=`gcloud projects list --filter="$PROJECT_ID" --format="value(PROJECT_NUMBER)"`
   ```

2. Create Service Account for Packer

   ```sh
   gcloud iam service-accounts create packer --description "Packer image builder"
   ```

3. Grant roles to Packer's Service Account

   ```sh
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --role="roles/compute.instanceAdmin.v1" \
     --member="serviceAccount:packer@${PROJECT_ID}.iam.gserviceaccount.com"
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --role="roles/iam.serviceAccountUser" \
     --member="serviceAccount:packer@${PROJECT_ID}.iam.gserviceaccount.com"
   ```

4. Allow CloudBuild to impersonate Packer service account

   ```sh
   gcloud iam service-accounts add-iam-policy-binding \
     packer@${PROJECT_ID}.iam.gserviceaccount.com \
     --role="roles/iam.serviceAccountTokenCreator" \
     --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
   ```

## Executing the Packer Builder

1. Adjust packer variables

   Edit provided `variables.pkrvars.hcl` example file and set following variables accordingly:
   * `project_id` - identifier of your project
   * `zone` - GCP Compute Engine zone for packer instance
   * `builder_sa` - Packer's service account email in a format of `name@{PROJECT_ID}.iam.gserviceaccount.com`

2. Run the build

   ```sh
   gcloud builds submit --config=cloudbuild.yaml .
   ```
