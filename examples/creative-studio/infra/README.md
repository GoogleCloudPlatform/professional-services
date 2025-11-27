# Creative Studio Infrastructure

This repository contains the Terraform configuration for deploying the Creative Studio application platform (frontend and backend) to Google Cloud.

## 🚀 Overview

This infrastructure is managed using a modular, environment-based approach with Terraform. The key principles are:
* **Don't Repeat Yourself (DRY):** All the logic for creating a service is defined once in a reusable **module**.
* **Strong Isolation:** Each environment (`dev`, `prod`, etc.) is managed in its own directory, with its own state file, to prevent accidental changes to production.

## 📁 Directory Structure

The project is organized into `modules` and `environments`.

```
infrastructure/
│
├── modules/                # Reusable "Blueprints"
│   ├── cloud-run-service/  # Defines how to build ONE service
│   └── platform/           # Defines the ENTIRE application platform
│
└── environments/
    ├── dev/                # Configuration for the 'dev' environment
    │   ├── main.tf         # Calls the platform module with dev values
    │   ├── backend.tf      # Defines where to store the dev state file
    │   └── dev.tfvars      # Contains all variables for dev
    │
    └── prod/               # Configuration for the 'prod' environment
        └── ...
```
* **`/modules`**: Contains reusable building blocks. The `platform` module is the main entry point, which in turn uses the `cloud-run-service` module.
* **`/environments`**: Contains a directory for each distinct deployment environment. These directories call the `platform` module with the correct set of variables.

---
## ⚠️ Manual Setup Steps

Before you can use Terraform, you must perform these one-time manual steps.

### 1. Install Prerequisite Software
You must install the following command-line tools on your local machine:
* **Terraform CLI:** [Install Terraform](https://learn.hashicorp.com/tutorials/terraform/install-cli)
```bash
# After you download the terraform binary
$ sudo cp ./terraform /usr/local/bin
$ sudo chmod +x /usr/local/bin/terraform

$ terraform version
Terraform v1.13.0
on linux_amd64
```
* **Google Cloud SDK:** [Install gcloud](https://cloud.google.com/sdk/docs/install)

### 2. Authenticate with Google Cloud
You need to authenticate your local machine with Google Cloud. This command will open a browser for you to log in.
```bash
gcloud auth list
gcloud config list

gcloud config set account <your account email>
gcloud auth login
gcloud config set project <your project id>
gcloud auth application-default set-quota-project <your project id>

gcloud auth list
gcloud config list
```

### 3. Create a GCS Bucket for Terraform State
Terraform needs a GCS bucket to store its state file for each environment. This must be done manually because the backend configuration is read before Terraform can create any resources.
>
**Run this command for each environment (dev, prod, etc.), making sure to use a globally unique bucket name:**
```bash
# Example for the 'dev' environment
export PROJECT_ID=creative-studio-arena && \
gsutil mb -p $PROJECT_ID gs://$PROJECT_ID-cstudio-dev-tfstate
```

### 4. Connect GitHub to Cloud Build
You must authorize Google Cloud Build to access your GitHub repository.
1.  Go to the Google Cloud Console: **Cloud Build > Settings**.
2.  Click **Connect repository 2nd Gen**.
3.  Choose **Create Host Connection > GitHub (Cloud Build GitHub App)** as the source.
4.  Follow the prompts to authenticate and install the GitHub App on your account and enable the required APIs if needed.
5.  **Crucially, grant the app access to your `MauroCominotti/maurocominotti-vertex-ai-creative-studio` repository.**
6.  Note the **Connection Name** (e.g., `gh-mauro-con`) as you will need it for your `.tfvars` file and select the **Region** of your choice.

### 5. Setup Firebase Auth and upgrade to use with Google Identity Platform
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your Google Cloud project from the list.
3.  In the left-hand navigation pane, go to **Build** > **Authentication**.
4.  Click **Get started**. This action enables Google Identity Platform for your project.
5.  If prompted, click **Upgrade to Identity Platform**. This gives you access to enterprise-grade features like multi-tenancy and SAML/OIDC federation, which are built on top of Firebase Authentication.
6.  Once enabled, navigate to the [Google Cloud Console](https://console.cloud.google.com/).
7.  In the navigation menu, go to **APIs & Services** > **Credentials**.
8.  Under the **OAuth 2.0 Client IDs** section, you will see a client named **Web client (auto created by Google Service)**. This is the client your web application will use to authenticate users via Identity Platform.
9.  Click on the name of the web client to open its details page.
10. Copy the **Client ID**. This value is the unique identifier for your web application.

    This Client ID serves as the **audience** for the OIDC tokens that Identity Platform issues to your authenticated users. When a user accesses your application through Identity-Aware Proxy (IAP), IAP will inspect the user's token and verify that its `aud` (audience) claim exactly matches this Client ID. This ensures that tokens intended for other applications cannot be used to access this one.

11. We will now use this Client ID as the value for the `IAP_AUDIENCE` variable in our Terraform configuration. Open the `environments/your-env/your-env.tfvars` file and add the following line, replacing `<YOUR_WEB_CLIENT_ID>` with the value you just copied:

    ```tfvars
    IAP_AUDIENCE = "<YOUR_WEB_CLIENT_ID>"
    ```

### 6. Setup env variables & Deploy Infra
#### 🛠️ Managing Environments

All commands should be run from within a specific environment's directory.

#### Creating a New Environment (e.g., `staging`)

1.  **Perform Manual Setup:** Create a new GCS bucket for the staging state (see Manual Step #3 above).
2.  **(Optional) Create the Directory:** Copy the `dev` directory: `cp -r environments/dev environments/staging`
3.  **Configure `backend.tf`:** Edit `environments/staging/backend.tf` to point to your new staging GCS bucket.
4.  **Configure/Update `your-env.tfvars`:** Rename `dev.tfvars` to `staging.tfvars` and update the values inside (project ID, service names, etc.) for your new environment.
5.  **Deploy:** Navigate to the new directory and run the standard `init` and `apply` commands.
    ```bash
    cd environments/staging
    terraform init
    terraform apply -var-file="staging.tfvars"
    ```


#### Deploying an Existing Environment (e.g., `dev`)

1.  **Navigate to the `dev` directory:**
    ```bash
    cd environments/dev
    ```
2.  **Initialize Terraform:**
    This downloads the necessary providers and configures the remote state backend.
    ```bash
    terraform init
    ```
3.  **Plan the changes:**
    Always review the plan carefully before applying.
    ```bash
    terraform plan -var-file="dev.tfvars"
    ```
4.  **Apply the changes:**
    This will build and deploy the infrastructure.
    ```bash
    terraform apply -var-file="dev.tfvars"
    ```

