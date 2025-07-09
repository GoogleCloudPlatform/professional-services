<div align="center">
  <img src="../mosaic-rag-logo.jpg" alt="Project Logo" width="250" style="border-radius: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
</div>

<h1 align="center">
  Mosaic RAG - Data Ingestion Pipeline 🏗️
</h1>

<p align="center">
  <img alt="Terraform" src="https://img.shields.io/badge/Terraform-Ready-blueviolet?style=for-the-badge&logo=terraform">
  <img alt="Google Cloud" src="https://img.shields.io/badge/Google_Cloud-Deployable-red?style=for-the-badge&logo=google-cloud">
  <img alt="Shell Script" src="https://img.shields.io/badge/Shell_Script-4EAA25?style=for-the-badge&logo=gnu-bash&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-Apache-purple?style=for-the-badge">
</p>

<p align="center">
  This directory contains the automated pipeline for provisioning the necessary Google Cloud infrastructure and deploying a <strong>Vertex AI RAG Corpus</strong>. It uses Terraform for infrastructure-as-code and Cloud Build for repeatable, automated data ingestion.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-workflow">Workflow</a> •
  <a href="#-deployment-details">Deployment Details</a> •
  <a href="#-project-structure">Project Structure</a> •
  <a href="#-cleanup">Cleanup</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## ✨ Features

* **Infrastructure as Code:** Uses **Terraform** to reliably define and manage all required Google Cloud resources (GCS Buckets, IAM, etc.).
* **Automated Corpus Deployment:** Leverages **Google Cloud Build** for a repeatable, automated process to create and populate the Vertex AI RAG Corpus.
* **Simplified Workflow:** Provides simple shell scripts (`deploy-infra.sh`, `deploy-rag.sh`) to manage the entire deployment lifecycle.
* **Clean Separation:** Infrastructure provisioning (`infra_deployment`) is cleanly separated from the data ingestion logic (`rag_corpus_deployment`).

## 🗂️ Supported Formats

The pipeline is designed to handle a mosaic of file types. When you upload files to the trigger bucket, the Cloud Function automatically processes them based on their extension:

*   **Documents**:
    *   `pdf`: Extracts text and any embedded images. The text is ingested directly, and the images are described by Gemini, with the descriptions also added to the corpus.
*   **Images**:
    *   `png`, `jpg`, `jpeg`, `webp`: Gemini generates a detailed description of the image, which is then ingested.
*   **Audio**:
    *   `mp3`, `m4a`, `aac`, `flac`, `wav`, `opus`, `mpga`, `mp4`, `pcm`, `webm`: Gemini transcribes or describes the audio content, and the resulting text is ingested.
*   **Video**:
    *   `mov`, `qt`, `flv`, `mpeg`, `mpg`, `wmv`, `3gp`: Gemini analyzes the video content and generates a description, which is then ingested.

## ✍️ Tweaking Prompts

The prompts used by the Cloud Function to generate descriptions and transcriptions for your multimedia files (images, videos, audio) are a key part of the ingestion process. You can customize these to better suit your specific data and needs.

### Where to Find the Prompts

The prompts are located within the Python source code of the Cloud Function, inside the `data-ingestion-pipeline/function_source/` directory. You will likely find string variables or functions that construct the prompts sent to the Gemini model.

### How to Modify

1.  **Locate the prompt strings:** Open the Python files in `function_source/`. Look for variables that hold text like `"Describe this image in detail:"` or `"Transcribe the following audio:"`.
2.  **Edit the prompt:** Change the text to alter the model's output. For example, you could ask for a more concise summary, a list of key entities, or a description in a specific tone.
    *   **For Images:** You could change `"Generate a detailed description of the image"` to `"Identify all the people in this image and describe their actions."`
    *   **For Videos:** You could change `"Analyze the video content and generate a description"` to `"Create a time-stamped summary of the key scenes in this video."`
3.  **Redeploy:** After modifying the prompts, you must redeploy the infrastructure for the changes to take effect. You can do this by running the `deploy-infra.sh` script again.

    ```bash
    ./deploy-infra.sh
    ```

This will zip up your modified function code, upload it, and update the Cloud Function, ensuring that all new files processed will use your new prompts.

## 🛠️ Tech Stack

* **Infrastructure:** Terraform
* **CI/CD & Automation:** Google Cloud Build, Shell Scripts
* **Cloud Platform:** Google Cloud Platform (Vertex AI, Cloud Storage, IAM, Cloud Build)

## 🚀 Workflow

Follow these steps to provision the infrastructure and deploy the RAG corpus.

### Prerequisites

* Google Cloud SDK installed and configured.
* Terraform installed.
* You are authenticated with Google Cloud:
  ```bash
  gcloud init
  gcloud auth
  gcloud auth application-default login
  ```
* Your target GCP Project is configured:
  ```bash
  gcloud config set project YOUR_PROJECT_ID
  ```

### 1. Configure Infrastructure ⚙️

The Terraform configuration requires variables such as your project ID and desired region.

1.  Create a `terraform.tfvars` file from the sample.
    ```bash
    # In the data-ingestion-pipeline/infra_deployment/ directory
    touch terraform.tfvars
    cp terraform.tfvars.sample terraform.tfvars
    ```
2.  Open `infra_deployment/terraform.tfvars` and fill in your specific configuration details (e.g., `project_id`, `region`).

### 2. Deploy Infrastructure 🏗️

Run the deployment script from the root of the `data-ingestion-pipeline` directory. This script executes `terraform apply` to create the necessary cloud resources, such as the GCS bucket for your source documents.

```bash
# Make sure you are in the data-ingestion-pipeline/ directory
chmod +x deploy-infra.sh
./deploy-infra.sh
```

### 3. Deploy RAG Corpus 🧠

This script grants the necessary IAM permissions and triggers a Cloud Build job. The job will create the Vertex AI RAG Corpus and ingest the documents from your GCS bucket.

```bash
# Make sure you are in the data-ingestion-pipeline/ directory
chmod +x deploy-rag.sh
./deploy-rag.sh
```

Upon completion, your RAG Corpus is ready to be used by the Mosaic RAG Agent.

### 4. Upload Source Documents ⬆️

After the infrastructure and RAG corpus is created, a Google Cloud Storage bucket will be available in the GCS console which ends with the name `**-trigger**`. Upload the documents you want to include in your RAG corpus to this bucket. The bucket name can be found in the Terraform output after the previous step completes.

## 📖 Deployment Details

*   **`deploy-infra.sh`**: This script navigates into the `infra_deployment` directory, initializes Terraform (`terraform init`), and applies the configuration (`terraform apply`). It provisions all resources defined in the `.tf` files.
*   **`deploy-rag.sh`**: This script first ensures the default Compute Engine service account has `aiplatform.admin` rights, which is often required for Cloud Build to manage Vertex AI resources. It then triggers the build process defined in `rag_corpus_deployment/cloudbuild.yaml`.

## 🧹 Cleanup

To remove all resources created by this pipeline, run the destruction script. This will execute `terraform destroy`, which is a **destructive action** that will tear down your GCS bucket and other related resources.

```bash
chmod +x destruct-infra.sh
./destruct-infra.sh
```

## 📂 Project Structure

```
.
├── infra_deployment/
│   ├── .gitignore
│   ├── main.tf                # Main Terraform configuration (example)
│   ├── variables.tf           # Terraform variable definitions (example)
│   └── terraform.tfvars.sample  # Sample variables for user configuration
├── rag_corpus_deployment/
│   └── cloudbuild.yaml        # Cloud Build config for corpus creation
├── deploy-infra.sh            # Script to deploy Terraform infrastructure
├── deploy-rag.sh              # Script to deploy the RAG corpus via Cloud Build
├── destruct-infra.sh          # Script to destroy Terraform infrastructure
└── README.md                  # You are here!
```

## 🤝 Contributing

Contributions are welcome! If you have suggestions for improvements or want to add new features, please feel free to open a pull request.

## 📄 License

This project is distributed under the MIT License.
