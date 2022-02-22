# Getting user profile from IAP-enabled GAE application
This example demonstrates how to retrieve user profile (e.g. name, photo) from an IAP-enabled GAE application.

## Initial Setup
This setup can be done from `Cloud Shell`.  
You need `Project Owner` permission to run this, e.g. for creating GAE app.

The following setup assumes that you are setting up your new application GCP project based on the 
following:
* GCP project: `project-id-1234`
* GAE region: `asia-northeast1`

1.  Set up environment variables.
    ```bash
    export PROJECT=project-id-1234
    export REGION=asia-northeast1
    ```

1.  Setup your gcloud
    ```bash
    gcloud config configurations create iap-user-profile
    gcloud config set project $PROJECT
    ```

1.  Create GAE application.
    ```bash
    gcloud app create --region=$REGION
    ```

1.  Enable required APIs
    ```bash
    gcloud services enable \
        iap.googleapis.com \
        secretmanager.googleapis.com \
        cloudresourcemanager.googleapis.com \
        people.googleapis.com
    ```

1.  Deploy this sample application. This will become the `default` service.  
    Note: IAP can only be enabled when there is already a service deployed in GAE.
    ```bash
    cd professional-services/examples/iap-user-profile/
    gcloud app deploy --quiet
    ```
    
1.  Configure `Consent Screen` on the below link  
    https://console.cloud.google.com/apis/credentials/consent?project=project-id-1234
    
    1.  Choose `Internal` for the `User Type`, then click `Create`
    1.  Type in the `Application name`, e.g. IAP User Profile Example
    1.  Choose the appropriate `Support email`. Alternatively, you can leave it to use your own email.
    1.  Fill in the `Authorized domains` based on your GAE application domain, e.g.
        * project-id-1234.an.r.appspot.com
    1.  Click `Save`

1.  Enable IAP on the below link for the `App Engine app`. Toggle on the button and then click `Turn On`.  
    https://console.cloud.google.com/security/iap?project=project-id-1234

1.  Add IAM policy binding to the IAP-enabled App Engine application.
    Register your user email to access the application.
    ```bash
    gcloud iap web add-iam-policy-binding --resource-type=app-engine \
          --member='user:your-user@domain.com' \
          --role='roles/iap.httpsResourceAccessor'
    ```
    
1.  Create new `Credentials` on the below link. This credential will be used by the OAuth2 login
    flow to retrieve the user profile.  
    https://console.cloud.google.com/apis/credentials?project=project-id-1234
    
    1.  Click `Create Credentials`. Choose `OAuth client ID`.
    1.  Choose `Web application` for the `Application type`
    1.  Type in `IAP User Profile Svc` for the `Name`
    1.  Fill in the `Authorized JavaScript origins`
        * https://project-id-1234.an.r.appspot.com
    1.  Fill in the `Authorized redirect URIs`
        * https://project-id-1234.an.r.appspot.com/auth-callback
    1.  Click `Create`
    1.  Click the newly created `IAP User Profile Example` credential and then click the `Download JSON` button.
        You'll need to paste the JSON content later as secret in the Secret Manager. 

1.  Create a secret in Secret Manager named `iap-user-profile-svc-oauth2-client` with the client credential JSON file as
    the value. 
    ```bash
    gcloud secrets create iap-user-profile-svc-oauth2-client \
        --locations=asia-southeast1 --replication-policy=user-managed \
        --data-file=/path-to/client_secret.json
    ```
    
1.  Add IAM policy binding to the secret for GAE default service account.
    ```bash
    gcloud secrets add-iam-policy-binding iap-user-profile-svc-oauth2-client \
          --member='serviceAccount:project-id-1234@appspot.gserviceaccount.com' \
          --role='roles/secretmanager.secretAccessor'
    ```

## Accessing the Application

1.  Access the application in your browser.  
    Note: If you are accessing it first time, it may take some time before the policy takes effect.
    Retry several times until you are prompted the OAuth login screen.  
    https://project-id-1234.an.r.appspot.com/
    
1.  You will be prompted the OAuth login one more time.  
    This is intended since we are going to use this scope to access your People API.

1.  You should be able to see your user profile displayed on the web page.
