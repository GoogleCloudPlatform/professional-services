# GCP Deployment & Identity-Aware Proxy (IAP) Guide

ASOP Studio supports two Google Cloud deployment modes using Terraform and `./deploy.sh`:
1. **Direct Cloud Run Deployment (Default)**: Fast, single-command deployment to Cloud Run + Artifact Registry using your active `gcloud` project.
2. **Enterprise IAP + HTTPS Load Balancer Deployment (Optional)**: Places an External Application Load Balancer and Identity-Aware Proxy (IAP) in front of Cloud Run with `INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER` isolation.

---

## Option A: Direct Cloud Run Deployment (Quickest)

If you want to deploy ASOP Studio to Cloud Run right away without setting up an External Load Balancer or OAuth Client:

1. Ensure the Cloud Run and Artifact Registry APIs are enabled:
   ```bash
   gcloud services enable run.googleapis.com artifactregistry.googleapis.com iam.googleapis.com
   ```
2. Run the deployment script (uses your active `gcloud` project by default, or `PROJECT_ID` / `REGION` / `SERVICE_NAME` environment variables):
   ```bash
   ./deploy.sh
   ```
   Or configure `terraform/terraform.tfvars` from `terraform/terraform.tfvars.example` with just `project_id` and `region`, then run `./deploy.sh`.

---

## Option B: Enterprise Deployment with Identity-Aware Proxy (IAP)

Identity-Aware Proxy (IAP) uses Google Accounts for user sign-in at the Load Balancer layer before traffic reaches Cloud Run. To enable IAP, configure the OAuth Consent Screen and create OAuth Client credentials.

### Step 1: Set up the Google Auth Platform
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your target GCP project.
3. Open the navigation menu and go to **APIs & Services** > **OAuth consent screen** (or search for **Google Auth Platform**).
4. Configure App Branding:
   - Click **Branding** in the left sidebar.
   - Set **App name**: `ASOP Studio`
   - Set **User support email**: Choose your email address.
   - Enter your email address under **Developer contact information**.
   - Click **Save**.
5. Configure Audience (User Type):
   - Click **Audience** in the left sidebar.
   - Choose the user access type appropriate for your team under **User Type**:
     - **Internal**: Only users belonging to your Google Workspace organization can authenticate (recommended for enterprise settings).
     - **External**: Anyone with a Google Account can authenticate (select this if you are using `@gmail.com` accounts or separate organizations; keep publishing status as **Testing** and add your allowed users under **Test users**).
   - Click **Save**.

### Step 2: Create the OAuth Client ID
1. Click **Clients** in the left sidebar (or go to **APIs & Services** > **Credentials**).
2. Click **+ Create Client** at the top of the page, and select **Web application** (or **+ Create Credentials** > **OAuth client ID**).
3. Set **Name**: `ASOP Studio IAP Client`.
4. Leave redirect URIs blank for now and click **Create** to generate the client.
5. Copy the generated **Client ID** and **Client Secret**.
6. Edit the client credential you just created and under **Authorized redirect URIs**, add the following (replacing `<CLIENT_ID>` with your actual Client ID):
   ```text
   https://iap.googleapis.com/v1/oauth/clientIds/<CLIENT_ID>:handleRedirect
   ```
7. Click **Save**.

### Step 3: Enable Required APIs & Configure `terraform.tfvars`
1. Enable the required GCP APIs:
   ```bash
   gcloud services enable compute.googleapis.com run.googleapis.com iap.googleapis.com artifactregistry.googleapis.com iam.googleapis.com
   ```
2. Copy the template variables file:
   ```bash
   cp terraform/terraform.tfvars.example terraform/terraform.tfvars
   ```
3. Edit `terraform/terraform.tfvars` to enable IAP:
   ```hcl
   project_id         = "your-gcp-project-id"
   region             = "us-central1"
   service_name       = "asop-studio"
   enable_iap         = true
   iap_client_id      = "your-oauth-client-id.apps.googleusercontent.com"
   iap_client_secret  = "your-oauth-client-secret"
   allowed_identities = [
     "user:allowed-user@example.com"
   ]
   # Optional: Custom domain name for Google-Managed SSL Certificate
   # domain_name      = "asop.example.com"
   ```
4. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

### Step 4: Accessing the IAP-Protected Application
- Access the application using the outputted URL: `https://<load_balancer_ip>` or your custom domain (e.g., `https://asop.example.com`).
  - *Raw IP*: Since the fallback SSL certificate is self-signed, your browser will display a warning (e.g., "Your connection is not private"). Proceed past the warning to reach the Google IAP sign-in screen.
  - *Custom Domain*: Google automatically provisions a Google-Managed SSL Certificate once your DNS A record points to `load_balancer_ip` (typically takes 10–30 minutes).
