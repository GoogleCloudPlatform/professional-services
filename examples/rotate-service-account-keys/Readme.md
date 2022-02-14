# Rotate service account keys in secret manager

The program helps to rotate the service account key in secret manager.

- **Step 1:** Creata a Pub/Sub Topic. Secret manager will publish a message to this topic as the secret approaches the expiration time.

    ```
    gcloud pubsub topics create "projects/PUBSUB_PROJECT_ID/topics/sm_rotation_notification"
    ```
    - PUBSUB_PROJECT_ID is the project id where topic is created. Replace it with the project-id where you are create a topic

    The name of the topic is `sm_rotation_notification`. If you want to name it something different, change the name.

- **Step 2:** Once the topic is create, we create a secret manager and add the credentials (service key json) file. Let's create a secret manager
    ```
    gcloud secrets create secret-id \
        --replication-policy "automatic" \
        --next-rotation-time="2021-03-01T09:00:00Z" \
        --rotation-period="2592000s" \
        --topics="projects/PUBSUB_PROJECT_ID/topics/sm_rotation_notification" \
        --data-file="/path/to/credentials"
    ```
    - PUBSUB_PROJECT_ID: Replace it with the project ID from step 1.
    - The rotation period is 30 days (30*24*60*60 seconds). Please change if you want the rotation period to be different.
    - `/path/to/credentials` is the path of the service account json key in you local drive.

- **Step 3:**  Secret manager needs to publish the message to the Pub/Sub Topic. Add the service account (service-PROJECT_NUMBER@gcp-sa-secretmanager.iam.gserviceaccount.com) a role to publish the message to a Pub/Sub Topic.

    The service account may not have been created. Use the following command to create a service account.

    ```
    gcloud beta services identity create  --service "secretmanager.googleapis.com" \
    --project "PROJECT_ID"
    ```

    - PROJECT_ID GCP project secret manager is enabled

   Now add a role binding, the above command with print the service account to use.

    ```
    gcloud pubsub topics add-iam-policy-binding PUBSUB_TOPIC_NAME \
    --member "serviceAccount:service-PROJECT_NUMBER@gcp-sa-secretmanager.iam.gserviceaccount.com" \
    --role "roles/pubsub.publisher"
    ```

- **Step 4:** Deploy the function.
    The secret manager publishes a message to the Notification Topic  which invokes the Cloud Function.Cloud function (Update Secrets) creates a new service account Key and uploads the service account key as a new secret version in secret manager. The Cloud function then deletes the service account key from Cloud IAM service account and  then disables and deletes the secret version from secret manager.

    In order to deploy Cloud Function run:

        ```
        gcloud functions deploy secret_rotation_fxn --entry-point \
        rotate_service_account_keys_in_secret_manager --runtime python37 \
        --trigger-resource sm_rotation_notification \
        --trigger-event google.pubsub.topic.publish
        ```

    By default Cloud function uses App Engine default service account (PROJECT_ID@appspot.gserviceaccount.com) as its identity for function execution. If required, individual service accounts can be created and used for your function by using the steps defined [here](https://cloud.google.com/functions/docs/securing/function-identity#individual). The service account used by the cloud function should have the following permissions two permission:
    - Service Account Key Admin(roles/iam.serviceAccountKeyAdmin): This role allow the cloud function to create new service account keys and delete the old service account keys.
    - Secret Manager Secret Version Manager (roles/secretmanager.admin): This role allows the cloud function to create a new version of the secret and delete the old versions.

