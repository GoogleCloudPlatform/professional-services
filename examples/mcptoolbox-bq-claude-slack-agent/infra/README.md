# Terraform Configuration for Spring Boot Cloud Run Deployment

This directory contains Terraform code to provision the necessary Google Cloud infrastructure for deploying the Spring Boot application to Cloud Run, along with supporting services like BigQuery, MCP Toolbox, and the needed permissions between components. Builds are managed by Cloud Build, and deployments are managed by Terraform.

## Prerequisites

1.  **Google Cloud SDK:** Install and initialize the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install). Ensure you are authenticated (`gcloud auth login`) and your default project is set (`gcloud config set project YOUR_PROJECT_ID`).
2.  **Terraform:** Install [Terraform](https://learn.hashicorp.com/tutorials/terraform/install-cli).
3.  **Permissions:** Ensure the user or service account running Terraform has the necessary permissions to create the resources defined (e.g., Project Owner, or a custom role with relevant permissions for Cloud Source Repositories, Artifact Registry, Cloud Build, Cloud Run, BigQuery, Secret Manager, and to submit builds).

## Setup and Deployment

1.  **Clone the repository:**
    ```bash
    # If you haven't already, clone the main application repository
    git clone <your-repo-url>
    cd <your-repo-name>
    ```

2.  **Configure Terraform Variables:**
    - Navigate to the `infra` directory:
      ```bash
      cd infra
      ```
    - Create a `terraform.tfvars` file by copying the example:
      ```bash
      cp terraform.tfvars.example terraform.tfvars
      ```
    - Edit `terraform.tfvars` and replace `your-gcp-project-id` with your actual Google Cloud Project ID. You can also change the `region` and other variables as needed.
      ```terraform
        project_id               = "your-gcp-project-id"
        region                   = "us-east5"                // Or your preferred region, when using VertexAI models check for region availability
        slackbot_workspace_token = "slackbot token value"
        slackapp_signing_secret  = "slack app secret value"
        model                    = "claude_vertexai"         // you can use gemini or claude_api here as well
        claude_apikey            = "api key value"           // only valid when using claude_api model configuration
      ```

3.  **Initialize Terraform:**
    ```bash
    terraform init
    ```

4.  **Apply Configuration & Trigger Build:**
    ```bash
    terraform plan
    terraform apply
    ```
    - Type `yes` when prompted to confirm resource creation/modification.
    - This command will provision all defined resources. If there are changes to your Java application code in the `../src` directory or to `../pom.xml`, running `terraform apply` will also trigger a Google Cloud Build. This build will containerize your application and push the image to GCP Artifact Registry.
    - Terraform will then ensure the Cloud Run service is deployed with the specified image.

5.  **Developing and Redeploying:**
    - Make changes to your Java application code in the `../src` directory or to `../pom.xml`.
    - Run `terraform apply` again from the `infra` directory.
        - This will trigger a new image build and push it to Artifact Registry.
        - Terraform will then update the Cloud Run service to use the new image.

6.  **Accessing the Application:**
    - The `terraform apply` command will output the URLs of the deployed Cloud Run services. This URL should be used to configure the Events subscribed as part of the Slack application.

## File Structure and Purpose

This section details the purpose of each Terraform (`.tf`) file within the `infra` directory and the Google Cloud resources they manage.

-   **`main.tf`**:
    -   **Purpose**: This is the primary entry point for Terraform. It configures the Google Cloud provider, specifying the project and region.

-   **`variables.tf`**:
    -   **Purpose**: Declares all the input variables used in the Terraform configuration. This includes variables for project ID, region, service names, BigQuery dataset/table names, Docker image names, etc.

-   **`terraform.tfvars.example`**:
    -   **Purpose**: Provides a template for users to create their own `terraform.tfvars` file. This file is used to assign specific values to the variables defined in `variables.tf`, such as your Google Cloud Project ID and preferred region. **It is crucial to copy this file to `terraform.tfvars` and customize it before running `terraform apply`.**

-   **`bigquery.tf`**:
    -   **Purpose**: Manages all BigQuery-related resources.
    -   **Resources Created**:
        -   `google_bigquery_dataset`: Creates a new BigQuery dataset to hold tables.
        -   `google_bigquery_table`: Creates a table within the dataset, defining its schema. The schema is configured for storing data related to user interactions or application events.
        -   `google_bigquery_job` (load job): This resource is configured to load initial data into the BigQuery table from a CSV file (`bigquery/data.csv`) located within the repository. This demonstrates how to populate the table. The load job is triggered when Terraform applies the configuration.

-   **`cloudbuild.tf`**:
    -   **Purpose**: Sets up Google Cloud Artifact Registry for Docker image storage and Google Cloud Build for automated build processes.
    -   **Resources Created**:
        -   `google_artifact_registry_repository`: Creates a Docker repository in Artifact Registry where container images for the applications will be stored.
        -   `google_cloudbuild_trigger`: Configures a Cloud Build trigger. This trigger is set up to automatically start a new build (defined by `cloudbuild.yaml` in the repository root) whenever changes are pushed to the connected Cloud Source Repository. This enables CI/CD for the applications.
        -   `google_project_iam_member`: Grants the Cloud Build service account necessary permissions (e.g., to push to Artifact Registry, deploy to Cloud Run).

-   **`mcptoolbox.tf`**:
    -   **Purpose**: Defines and configures the MCP Toolbox for Databases as a Cloud Run service. For more information on the possible configurations and supported GCP databases see the [documentation](https://googleapis.github.io/genai-toolbox/resources/sources/).
    -   **Resources Created**:
        -   `google_cloud_run_v2_service`: Deploys the MCPToolbox application as a serverless Cloud Run service.
        -   `google_secret_manager_secret` & `google_secret_manager_secret_version`: Creates a secret in Google Secret Manager to store the configuration for MCPToolbox (e.g., `tools.yaml`). The content of the secret is sourced from the `mcptoolbox/tools.yaml.tpl` template file.
        -   `google_service_account`: Creates a dedicated service account for the MCPToolbox Cloud Run service to run with specific, limited permissions.
        -   `google_project_iam_member`: Assigns necessary roles/permissions to the MCPToolbox service account (e.g., access to specific GCP services it might need to interact with).
        -   The Cloud Run service is configured to allow unauthenticated invocations.

-   **`slackapp_service.tf`**:
    -   **Purpose**: Defines and configures the Slack App Cloud Run service. This service is registered to listen specific Slack events and handles interactions with a Slack workspace (e.g., receiving slash commands, sending notifications).
    -   **Resources Created**:
        -   `google_cloud_run_v2_service`: Deploys the Slack App application as a serverless Cloud Run service. Its Docker image is also expected to be in Artifact Registry.
        -   **Environment Variables**: The Cloud Run service is configured with environment variables directly in this file (e.g., `SLACK_SIGNING_SECRET`, `SLACK_BOT_TOKEN`).
        -   `google_service_account`: Creates a dedicated service account for the Slack App Cloud Run service.
        -   `google_project_iam_member`: Assigns necessary roles/permissions to the Slack App service account.
        -   The Cloud Run service is configured to allow unauthenticated invocations.

-   **`outputs.tf`**:
    -   **Purpose**: Defines outputs that will be displayed after Terraform successfully applies the configuration.
    -   **Outputs Defined**:
        -   `mcp_toolbox_url`: The URL of the deployed MCPToolbox Cloud Run service.
        -   `slack_app_url`: The URL of the deployed Slack App Cloud Run service.
        -   `cloud_run_service_url`: The URL of the main Spring Boot application's Cloud Run service (if defined separately, otherwise this might be one of the above).
        -   `cloud_build_trigger_id`: The ID of the created Cloud Build trigger.
        -   `artifact_registry_repository_id`: The ID of the Artifact Registry repository.

-   **Other Files in `infra/`**:
    -   `infra/bigquery/data.csv`: Sample data loaded into the BigQuery table.
    -   `infra/mcptoolbox/tools.yaml.tpl`: Template for the MCP Toolbox configuration, which is stored in Secret Manager.

## Cleaning Up

To remove all the resources created by this Terraform configuration:

```bash
terraform destroy
```
Type `yes` when prompted.
