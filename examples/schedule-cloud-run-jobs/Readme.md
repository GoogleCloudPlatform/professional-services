## Scheduling Command in GCP using Cloud Run and Cloud Scheduler

There are some scenarios where running a command regularly in you environment is necessary without a need of orchestration tool such as Cloud Composer. In this example we schedule a command using Cloud Run and Cloud Scheduler.

Once such example is running copying some objects from bucket (i.e., GCS or S3) to another bucket. It is really easy to copy files between different bucket using gsutil. Developers do this regualrly in from their workstation. But the replicating this adhoc  behaviour in a schedule includes writing code and creating some schedule in tools such as Data Fusion or Cloud Composer. In this repo we walk through the process of scheduling commands such as gsutil command using Cloud Run and Cloud Scheduler. We will go through both GCS to GCS and S3 to GCS copy.


- **Step 1:** Enable services (Cloud Scheduler, Cloud Run) and create a service account and permissions


    ```
    export PROJECT_ID=<<project-id>>
    export PROJECT_NUMBER=<<project-number>>
    export SERVICE_ACCOUNT=cloud-run-sa

    gcloud services enable cloudscheduler.googleapis.com run.googleapis.com cloudbuild.googleapis.com \
        cloudscheduler.googleapis.com --project ${PROJECT_ID}

    gcloud iam service-accounts create ${SERVICE_ACCOUNT} \
        --description="Cloud run to copy cloud storage objects between buckets" \
        --display-name="${SERVICE_ACCOUNT}" --project ${PROJECT_ID}

    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
        --member serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com \
        --role "roles/run.invoker" 
    ```

    To deploy a Cloud Run service using a user-managed service account, you must have permission to impersonate (iam.serviceAccounts.actAs) that service account. This permission can be granted via the roles/iam.serviceAccountUser IAM role. 

    ```
    gcloud iam service-accounts add-iam-policy-binding ${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com   \
        --member "user:<<your_email>>" \
        --role "roles/iam.serviceAccountUser" --project ${PROJECT_ID}
    ```

- **Step 2:** Create a docker image and push to GCR.  Navigate to gcs-to-gcs folder and push to image

    ```
    cd gcs-to-gcs
    gcloud builds submit -t "gcr.io/${PROJECT_ID}/gsutil-gcs-to-gcs" --project ${PROJECT_ID}
    ```

- **Step 3:** Create a job with the GCS_SOURCE and GCS_DESTINATION for gcs-gcs bucket. Make sure to give the permission (roles/storage.legacyObjectReader) to the GCS_SOURCE and roles/storage.legacyBucketWriter to GCS_DESTINATION

    ```
    export GCS_SOURCE=<<Source Bucket>>
    export GCS_DESTINATION=<<Source Bucket>>

    gcloud storage buckets add-iam-policy-binding ${GCS_SOURCE} \
    --member=serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com \
    --role=roles/storage.objectViewer

    gcloud storage buckets add-iam-policy-binding ${GCS_DESTINATION} \
    --member=serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com \
    --role=roles/storage.legacyBucketWriter

    gcloud beta run jobs create gcs-to-gcs \
        --image gcr.io/${PROJECT_ID}/gsutil-gcs-to-gcs \
        --set-env-vars GCS_SOURCE=${GCS_SOURCE} \
        --set-env-vars GCS_DESTINATION=${GCS_DESTINATION} \
        --max-retries 5 \
        --service-account ${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com \
        --region $REGION --project ${PROJECT_ID}
    ```

- **Step 4:** Finally, create a schedule to run the job. 

    ```
    gcloud scheduler jobs create http gcs-to-gcs \
        --location $REGION \
        --schedule="0 1 * * 0" \  --uri="https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT_ID}/jobs/gcs-to-gcs:run" \
        --http-method POST \
        --oauth-service-account-email ${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com --project ${PROJECT_ID}
    ```
