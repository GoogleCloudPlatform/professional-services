# Firebase Authentication & OAuth Manual Setup Guide

This guide details the manual steps required to fully configure Firebase Authentication and Google Sign-In for the Cymbal Conversational AI application, complementing the automated Terraform infrastructure deployment.

## Prerequisites
Before starting, ensure you have:
1. Deployed the infrastructure using Terraform (`make deploy` or `terraform apply` in the `infra/` folder).
2. Access to the [Google Cloud Console](https://console.cloud.google.com/) and [Firebase Console](https://console.firebase.google.com/) with Owner permissions for the target project.

---

## Step 1: Configure OAuth Consent Screen (GCP Console)
To allow users to authenticate using their Google accounts, you must configure the OAuth Consent Screen in your Google Cloud Project.

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project.
3. Navigate to **APIs & Services > OAuth consent screen** in the left sidebar.
4. Select the **User Type**:
   * **Internal:** (Recommended for Google-internal deployments) Restricts access exclusively to users within the `@google.com` (or your organization's) domain.
   * **External:** Allows any Google account to sign in (useful for testing with personal accounts, but subject to verification limits).
5. Click **Create**.
6. Fill in the required App Information:
   * **App name:** e.g., `Cymbal Advisor`
   * **User support email:** Select your email.
   * **Developer contact information:** Enter your email.
7. Click **Save and Continue**.
8. In the **Scopes** step, click **Add or Remove Scopes** and select:
   * `.../auth/userinfo.email`
   * `.../auth/userinfo.profile`
   * `openid`
9. Click **Save and Continue** and complete the wizard.

---

## Step 2: Enable Google Sign-In in Firebase Console
Terraform provisions the Firebase project and Web App, but the Google Authentication provider must be manually enabled in the Firebase Console.

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click on your project (it should already be visible if you ran Terraform).
3. In the left navigation bar, go to **Build > Authentication**.
4. Click **Get Started** (if configuring Authentication for the first time).
5. Select the **Sign-in method** tab.
6. Under **Additional providers**, click **Google**.
7. Toggle the **Enable** switch.
8. Set the **Project public-facing name** (e.g., `Cymbal Advisor`).
9. Select a **Project support email** from the dropdown.
10. Click **Save**.
    * *Note: Firebase will automatically create/link the necessary Web Client ID in your GCP project credentials.*

---

## Step 3: Verify OAuth Redirect URIs (GCP Console)
If you encounter `redirect_uri_mismatch` errors during sign-in, verify that the Firebase auth handler is authorized in your GCP Credentials.

1. In the [GCP Console](https://console.cloud.google.com/), go to **APIs & Services > Credentials**.
2. Under **OAuth 2.0 Client IDs**, find the client auto-created by Firebase (usually named `Web client (auto created by Google Service)`). Click the edit (pencil) icon.
3. Scroll down to the **Authorized redirect URIs** section.
4. Verify that the following URI is present:
   `https://<your-gcp-project-id>.firebaseapp.com/__/auth/handler`
   *(Replace `<your-gcp-project-id>` with your actual project ID, which can be found in the Terraform outputs as `firebase_project_id`).*
5. If missing, click **Add URI**, paste the address, and click **Save**. (It may take a few minutes for Google to apply the changes).

---

## Step 4: Configure Frontend Environment Variables
Once the infrastructure is deployed and Firebase is configured, you must update the frontend's environment configuration.

1. Run `terraform output` in the `infra/` directory to retrieve your Firebase configuration. You should see:
   * `firebase_api_key`
   * `firebase_auth_domain`
   * `firebase_project_id`
   * `firebase_app_id`
2. Create or open the `frontend/.env` file.
3. Populate the Firebase placeholders with the values from the Terraform output:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```
4. Restart your development server (`make stop-dev` and `make dev`) to apply the new environment variables.
