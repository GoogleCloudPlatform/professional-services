# Airflow v1 to v2 Dag Code Translation with Vertex AI Gemini API

This Cloud Run service reads dag code files from a Google Cloud Storage (GCS) bucket, performs a code translation from Airflow v1 to v2 using a Vertex AI Generative Model based on the provided prompt, and writes the resulting dag files to another GCS bucket.

## Prerequisites

1.  **Google Cloud SDK (`gcloud`)**: [Install Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2.  **Docker**: [Install Docker](https://docs.docker.com/get-docker/)
3.  **Git**: [Install Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
4.  **GCP Project**: A Google Cloud Project with billing enabled.
5.  **APIs Enabled**: In your GCP project, ensure the following APIs are enabled:
    *   Artifact Registry API (`artifactregistry.googleapis.com`)
    *   Cloud Run API (`run.googleapis.com`)
    *   Vertex AI API (`aiplatform.googleapis.com`)
    *   Cloud Storage API (`storage.googleapis.com`)
    *   Cloud Build API (`cloudbuild.googleapis.com`) if using Cloud Build for image creation

### IAM Permissions
#### A. Permissions for the Deployer (User or Service Account deploying the Cloud Run service)
The entity (user or service account) deploying the Cloud Run service needs:
##### 1. Artifact Registry Writer: To push Docker images.
* Role: roles/artifactregistry.writer
* On: The Artifact Registry repository or the project.
##### 2. Cloud Run Admin: To create, update, and manage Cloud Run services.
* Role: roles/run.admin
* On: The project.
##### 3. IAM Service Account User: To act as/assign the runtime service account to the Cloud Run service.
* Role: roles/iam.serviceAccountUser
* On: The runtime service account (RUNTIME_SERVICE_ACCOUNT).

#### B. Permissions for the Cloud Run Service's Runtime Service Account
The service account that the Cloud Run service runs as (RUNTIME_SERVICE_ACCOUNT specified during deployment) needs:
##### 1. Google Cloud Storage Access:
* To read from the input bucket: roles/storage.objectViewer on the input bucket.
* To write to the output bucket: roles/storage.objectCreator (and storage.legacyBucketWriter if overwriting) on the output bucket.
* Alternatively, roles/storage.objectAdmin on both buckets provides full read/write access.
##### 2. Vertex AI User: To make calls to Vertex AI models.
* Role: roles/aiplatform.user (provides broad access) or more specifically roles/aiplatform.endpoints.predict (if only prediction is needed).
* On: The project.
##### 3. Cloud Logging Writer (Optional - Usually granted by default): To write logs.
* Role: roles/logging.logWriter
* On: The project.

Ensure the RUNTIME_SERVICE_ACCOUNT is created and granted these permissions before deploying the Cloud Run service.

## Setup and Deployment

### 1. Clone the Repository

```bash
# Replace with your actual repository URL
git clone https://<your-git-repository-url>/code_converter.git
cd code_converter
```

### 2. Configure Environment Variables
Set these environment variables in your shell. They will be used in subsequent commands.
```
export PROJECT_ID="your-gcp-project-id"
export REGION="your-gcp-region" # e.g., us-central1
export ARTIFACT_REPO_NAME="my-python-apps" # Or your preferred Artifact Registry repo name
export IMAGE_NAME="gcs-vertexai-converter"
export SERVICE_NAME="gcs-vertexai-converter-service"
```
# Service account for Cloud Run runtime (must be created beforehand)
```
export RUNTIME_SERVICE_ACCOUNT="your-cloud-run-sa-email@${PROJECT_ID}.iam.gserviceaccount.com"
```

# Configure gcloud CLI
```
gcloud config set project ${PROJECT_ID}
gcloud config set run/region ${REGION}
gcloud config set artifacts/location ${REGION} # For Artifact Registry
```

### 3. Create an Artifact Registry Docker Repository (if it doesn't exist)
```
gcloud artifacts repositories create ${ARTIFACT_REPO_NAME} \
    --repository-format=docker \
    --location=${REGION} \
    --description="Docker repository for Python applications"
```

### 4. Build the Docker Image & push it to artifact registry

```
gcloud builds submit -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO_NAME}/${IMAGE_NAME}:latest .
```

### 5. Deploy to Cloud Run
This command deploys the service. Adjust parameters like --memory, --cpu, --timeout, and --concurrency as needed.
```
gcloud run deploy ${SERVICE_NAME} \
    --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO_NAME}/${IMAGE_NAME}:latest \
    --platform=managed \
    --region=${REGION} \
    --service-account=${RUNTIME_SERVICE_ACCOUNT} \
    --no-allow-unauthenticated \
    --timeout="3600s" \
    --memory=2Gi \
    --cpu=1
    # Optional: Set instance-wide environment variables if not overriding in every request
    # --set-env-vars=GOOGLE_CLOUD_PROJECT=${PROJECT_ID}
    # --set-env-vars=VERTEX_AI_LOCATION=${REGION} # e.g., us-central1 if your model is there
```

##### Note on Invocation Permissions:
* ```--allow-unauthenticated:``` Makes the service publicly accessible.
* ```--no-allow-unauthenticated:``` Requires callers to have roles/run.invoker permission on the service.


### 8. Invoke the Service
Once deployed, Cloud Run will provide a service URL. You can use curl to send a POST request with a JSON payload.
##### Example curl command:
Get your service URL:
```
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')
echo "Service URL: ${SERVICE_URL}"
```

Prepare your JSON payload. Example payload.json:
```
{
    "project_id": "your-gcp-project-id",
    "location": "us-central1",
    "read_bucket_name": "your-input-bucket-name",
    "input_folder_path": "path/to/input/files/",
    "write_bucket_name": "your-output-bucket-name",
    "output_folder_path": "path/to/converted/output/",
    "model_id": "gemini-1.5-flash-001",
    "system_instruction": "You are a helpful code conversion assistant. Convert the provided code snippet. Ensure the output is only the converted code, without any extra explanations or markdown formatting.",
    "user_question_template": "Please convert the following Airflow v1 Python DAG code to be compatible with Airflow v2. Only provide the converted Python code. \n\nCode:\n{code_content}",
    "prompt_variables": {
        "target_framework_version": "Airflow 2.x"
    },
    "file_extension_filter": [".py"],
    "max_workers": 10
}
```

* Ensure input_folder_path ends with a / if it's a folder, or is an empty string "" for the bucket root.
* Ensure output_folder_path ends with a /.
Send the request:
```
# If your service requires authentication:
# TOKEN=$(gcloud auth print-identity-token)
# curl -X POST -H "Authorization: Bearer ${TOKEN}" -H "Content-Type: application/json" -d @payload.json ${SERVICE_URL}

# If your service allows unauthenticated access:
curl -X POST -H "Content-Type: application/json" -d @payload.json ${SERVICE_URL}
```
Output will be a JSON response summarizing the processing done along with the converted dags in the specified output folder. Gemini provides detailed comments about the code changes done within the translated dag files itself.

