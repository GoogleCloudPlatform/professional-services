# CloudBuild with Terraform at Scale

CloudBuild gives your Terraform deployment a boost and scale allowing you to concurrently deploy your infrastructure across multiple GCP regions. This example uses [private Cloud Build worker pool](https://cloud.google.com/build/docs/private-pools/private-pools-overview) that enables 100+ maximum concurrent builds.

1. Ensure that $PROJECT_ID environment variable is set:

    ```bash
    export PROJECT_ID = [PROJECT_ID]
    ```

1. Enable CloudBuild on your project:

    ```bash
    gcloud services enable cloudbuild.googleapis.com container.googleapis.com compute.googleapis.com cloudresourcemanager.googleapis.com
    ```

1. Build the Terraform builder

    ```bash
    # run from the terraform directory (cd ../..)
    gcloud builds submit --config=cloudbuild.yaml
    ```

1. Give permissions to the Cloud Build service account to create infrastructure. This example uses `roles/owner` for simplicity, but you should restrict to the requried roles.

    ```bash
    export PROJECT_NUM=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
    gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member serviceAccount:$PROJECT_NUM@cloudbuild.gserviceaccount.com \
    --role roles/owner
    ```

1. Create a private Cloud Build pool with all the default settings. Private pools allow running 100+ concurrent builds. 

    ```bash
        export WORKER_POOL_ID=${PROJECT_ID}_CB_POOL
        export WORKER_POOL_REGION=us-central1
        gcloud builds worker-pools create $WORKER_POOL_ID \
        --project=$PROJECT_ID \
        --region=$WORKER_POOL_REGION
    ```

1. (optional step) Test on one build before running multi-build

    ```bash
        REGION=asia-east1
        ZONE=asia-east1-a
        BUCKET_NAME=$PROJECT_ID-$ZONE-tfbucket-1
        gsutil mb -l $REGION gs://$BUCKET_NAME
        printf "Running in region %s, zone %s\n" "${REGION}" "${ZONE}"
        gcloud builds submit  \
            --worker-pool=projects/${PROJECT_ID}/locations/${WORKER_POOL_REGION}/workerPools/${WORKER_POOL_ID} . \
            --timeout=1200s \
            --config=cloudbuild.yaml \
            --region=$WORKER_POOL_REGION \
            --substitutions=_BUCKET=$BUCKET_NAME,_REGION=$REGION,_ZONE=$ZONE
    ```

1. Run multi-build to deploy to 80+ regions concurrently. NOTE: this example is intended to demonstrate the maximum possible scale. To avoid incurring infrastructure scale, we recommend that you edit multi-build.sh and only keep a coupld of regions before deploying.

    ```bash
    bash ./multi-build.sh
    ```
