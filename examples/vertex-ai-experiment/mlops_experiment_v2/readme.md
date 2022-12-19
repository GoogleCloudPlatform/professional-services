MLOPS - End To End Workflow using :

![alt text](https://github.com/paragsmhatre/professional-services/blob/vertex-ai-experiment/examples/vertex-ai-experiment/mlops_experiment_v2/ARCHITECTURE/High_Level_Architecture.png?raw=true)

Dataset: Random Dataset For Link Prediction

1. Vertex AI
    - Train Custom ML Model (Done)
    - Hyper Prameter Tunning for Custom Model (Done)
    - Custom Model Validation (Done)
    - Vertex AI datasets (Done)
    - Vertex AI Batch Prediction (Done)
2. Dataflow - For Data Preprocessing (Done)
3. Big Query - For Data Storage (Done)
4. Cloud Build - For CI/CD (Done)
5. Alert based on Cloud Monitoring (Done)
6. Looker Dashboard - MLOps Visualisation (In-Progress)
7. TFDV - For Data Validation (Done)
8. Pubsub and Cloud Function - for continuous dataupdate monitoring (In-Progress)
9. Scheduled Batch Prediction (In-Progress)
10. Online Serving for Websites / UI Integration (In-Progress)

Step 1: Create New Google Cloud Project
```
mlops-experiment-v2
```

Step 2: Enable required services
Open Cloud Shell and run following command
```
gcloud services enable cloudbuild.googleapis.com \
    aiplatform.googleapis.com compute.googleapis.com containeranalysis.googleapis.com containerregistry.googleapis.com \
    cloudbuild.googleapis.com iam.googleapis.com sourcerepo.googleapis.com pubsub.googleapis.com artifactregistry.googleapis.com \
    logging.googleapis.com bigquery.googleapis.com storage.googleapis.com notebooks.googleapis.com dataflow.googleapis.com \
    run.googleapis.com eventarc.googleapis.com  datastore.googleapis.com cloudresourcemanager.googleapis.com
```

Step 3 : Create New BQ Dataset and Upload Data to BQ 
Note : Sample dataset is stored in DATA folder

Step 4: Create Cloud Build Service Account
```
gcloud iam service-accounts create build-sa --description="CI/CD Build Service Account" --display-name="Build Service Account"
```

Step 5: Create Vertex AI Build Service Account
```
gcloud iam service-accounts create vertex-ai-sa --description="Vertex AI Service Account" --display-name="Vertex AI Service Account"
```

Step 6: Create Artifact Repository 
```
mlops-experiment-v2
```

Step 7 : Give "Cloud Build Service Agent" role for build-sa

Step 8 : Add Permission to "Cloud Build Service Account" for build-sa for mlops-experiment-v2

Step 9 : Connect Github Repository with Cloud Build

Step 10 : Create Cloud Storage Bucket 
```
mlops-experiment-v2-bucket
```
Step 11: Create folders in  mlops-experiment-v2-bucket
```
mlops-experiment-v2-bucket/dataflow
mlops-experiment-v2-bucket/vertex-ai
mlops-experiment-v2-bucket/tfdv
```

Step 12 : Add Permission to build-sa for logwritter role
```
gcloud projects add-iam-policy-binding mlops-experiment-v2  --member=serviceAccount:build-sa@mlops-experiment-v2.iam.gserviceaccount.com --role=roles/logging.logWriter
``` 

Step 13 : Add Permission to build-sa for "Cloud Build Service Agent" to Cloud Storage bucket "mlops-experiment-v2-bucket"

Step 14 : Add following permission to vertex-ai-sa on IAM Page.
AI Platform Service Agent
Artifact Registry Service Agent
Cloud Build Service Account
Cloud Dataflow Service Agent
Cloud Functions Service Agent
Cloud Pub/Sub Service Agent
Cloud Run Service Agent
Storage Object Creator
Vertex AI Service Agent
Dataflow Admin
Dataflow Worker
Storage Admin
Storage Object Admin
Storage Object Creator

Step 14 : Add following permission to build-sa on IAM Page.
AI Platform Service Agent
Artifact Registry Service Agent
Cloud Build Service Account
Cloud Dataflow Service Agent
Cloud Functions Service Agent
Cloud Pub/Sub Service Agent
Cloud Run Service Agent
Dataflow Admin
Dataflow Worker
Storage Admin
Storage Object Admin
Storage Object Creator
Vertex AI Service Agent

Step 15: add Following permission to Cloud Storage bucket "mlops-experiment-v2-bucket" vertex-ai-sa service account
Dataflow Admin
Dataflow Worker
Storage Admin
Storage Object Admin
Storage Object Creator

Step 16: Add following roles for dataflow

```
export PROJECT_ID=$(gcloud config get-value project)
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

gcloud projects add-iam-policy-binding ${PROJECT_ID} --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" --role=roles/dataflow.admin

gcloud projects add-iam-policy-binding ${PROJECT_ID} --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" --role=roles/dataflow.worker

gcloud projects add-iam-policy-binding ${PROJECT_ID} --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" --role=roles/storage.objectAdmin
```

Step 17 : Add following permission to PROJECT_ID-compute@developer.gserviceaccount.com on IAM Page.
AI Platform Admin
AI Platform Developer
BigQuery Admin
Dataflow Admin
Dataflow Worker
Service Account User
Storage Object Admin
Vertex AI User
