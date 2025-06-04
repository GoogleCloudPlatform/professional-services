# GenAI-Powered Code Modification Cloud Function
This tool contains the code and Terraform infrastructure needed to deploy a Google Cloud Function designed to automatically generate code modifications using the Vertex AI Gemini API. The function reads files from a GitHub repository, processes them with a large language model (LLM) to generate modified code, and then saves these modifications to another repository (or the same one).

# Features
- **AI-Powered Code Generation:** Utilizes Vertex AI Gemini models to transform or adapt code.
- **GitHub Integration:** Reads and writes files directly to GitHub repositories.
- **Easy Deployment:** Includes Terraform code for automated deployment on Google Cloud.
- **Flexible Configuration:** Allows specifying repositories, branches, file paths, and model parameters.

# Prerequisites
Before deploying and using this Cloud Function, ensure you have the following:

- A Google Cloud account with billing enabled.
- The Google Cloud SDK (gcloud) installed and authenticated.
- Terraform installed.
- A GitHub Personal Access Token (PAT) with the necessary permissions to read from and write to the specified repositories. This token must be stored in Google Secret Manager under the secret name **github_token** with a JSON payload containing a key github_token (e.g., {"github_token": "YOUR_GITHUB_TOKEN"}).
- A GCS bucket to store your Terraform state (configure this in backend.tf).

# Deployment
Follow these steps to deploy the Cloud Function using Terraform:

**1. Prepare the Deployment**
- Clone the repository in your Cloud Shell or Terraform environment where you are going to deploy the Cloud Function.
- Set the working directory to be **github-repos/professional-services/tools/genai-code-mod-auto/terraform** this can be done with the cd command in the shell or a configuration in terraform.

**2. Configure Terraform**
Navigate to the directory where your Terraform files are located.

- **backend.tf:** This is commented by default, in case you need to have a backend uncomment the code and update the bucket and prefix with the GCS bucket information where Terraform will store its state.

- **variables.auto.tfvars:** Update the following variables:
    - **project_id:** Your Google Cloud project ID.
    - **location:** The region where you want to deploy the function (e.g., us-east4).
    - **stg_cf_bucket:** The bucket where the source code for the cloud function will be stored

The variables **code_trans_sa_roles** and **required_apis** contain the necessary APIS and service account permissions for the function to work properly.

**3. Execute Terraform**

Initialize Terraform, then plan and apply the changes:

```shell

terraform init
terraform plan
terraform apply
```

Confirm the application when prompted. This will create the following resources in your Google Cloud project:

- A service account with the necessary roles (roles/secretmanager.secretAccessor, roles/storage.objectUser, roles/aiplatform.user, among others).

- A GCS bucket to store the Cloud Function's source code.

- The second-generation Cloud Function (code_trans) configured with the specified timeout, memory, and service account.

- Required Google Cloud APIs will be enabled.

# Usage
Once deployed, the Cloud Function can be invoked via an HTTP POST request.

## Invocation URL
You can find the URL of your Cloud Function in the Google Cloud console or by running:

```shell
gcloud functions describe code_trans --region us-east4 --format="value(serviceConfig.uri)"
```

## Request Payload
The function expects a JSON body with the following structure:

```json
{
    "read_repo_name": "owner/repository-to-read",
    "read_branch": "branch-to-read-from",
    "write_repo_name": "owner/repository-to-write",
    "write_branch": "branch-to-write-to",
    "paths": ["path/to/file1.sql", "path/to/file2.py"],
    "model_id": "gemini-1.5-pro-002",
    "system_instruction": [
        "Your role is to translate SQL code.",
        "Convert the following Redshift SQL to BigQuery SQL.",
        "Provide only the translated code in your response."
    ],
    "question": "Translate the following SQL code."
}
```

**Where:**
- **read_repo_name:** The full name of the GitHub repository from which to read files (e.g., signifyd/dbt).
- **read_branch:** The branch of the read repository (e.g., main).
- **write_repo_name:** The full name of the GitHub repository where modifications will be written (e.g., signifyd/dbt).
- **write_branch:** The branch of the write repository. If the branch doesn't exist, it will be created.
- **paths:** A list of file paths within the repository to process.
- **model_id:** The ID of the Vertex AI Gemini model to use (e.g., gemini-1.5-pro-002).
- **system_instruction:** A list of system instructions to guide the AI model's behavior. This is crucial for defining the model's task.
- **question:** The main question or prompt that will be given to the model along with the file content.

## Example Invocation (with curl)
To invoke the function, use the following curl command. Make sure to replace the Cloud Function URL with your own and have your gcloud credentials active to obtain the identity token.

```shell
curl -X POST https://YOUR_CLOUD_FUNCTION_URL \
-H "Authorization: bearer $(gcloud auth print-identity-token)" \
-H "Content-Type: application/json" \
-d '{
    "read_repo_name": "owner/repository-to-read",
    "read_branch": "branch-to-read-from",
    "write_repo_name": "owner/repository-to-write",
    "write_branch": "branch-to-write-to",
    "paths": ["path/to/file1", "path/to/file2"],
    "model_id": "gemini-1.5-pro-002",
    "system_instruction": [
        "Your role is to translate SQL code.",
        "Convert the following Redshift SQL to BigQuery SQL.",
        "Provide only the translated code in your response."
    ],
    "question": "Translate the following Redshift SQL code into BQ SQL code"
}'
```

# Key Files
- **main.py:** The source code of the Cloud Function. It contains the logic for interacting with GitHub, Secret Manager, and Vertex AI.
- **requirements.txt:** The Python dependencies required for the Cloud Function.
- **backend.tf:** Terraform backend configuration for state storage.
- **provider.tf:** Defines the Google Cloud provider for Terraform.
- **variables.tf:** Terraform variable declarations.
- **variables.auto.tfvars:** Initialization of Terraform variables.
- **cloud_functions.tf:** The main Terraform code to deploy the Cloud Function and associated resources (service account, storage bucket).

# Security Considerations
- **GitHub Token:** It's crucial that your GitHub Personal Access Token is securely managed using Google Secret Manager. Never hardcode your token directly in the code or Terraform files.
- **Service Account Permissions:** The service account created by Terraform has the minimum necessary permissions to function. Review and adjust these roles if your security requirements demand it.
- **Function Access:** By default, the function is configured with ingress_settings = "ALLOW_ALL". Consider restricting access if necessary for your use case.
