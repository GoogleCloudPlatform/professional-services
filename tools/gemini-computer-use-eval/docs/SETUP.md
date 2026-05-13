# Setup & Installation

This guide details the prerequisites and steps to set up the Computer Use Evaluation Pipeline.

## 1. Prerequisites

Before running the pipeline, ensure your environment meets the following requirements:

*   **Operating System:** Linux or macOS (Windows requires WSL2).
*   **Python:** Version 3.10 or higher.
*   **Dependencies:**
    *   **[uv](https://github.com/astral-sh/uv):** Required for fast, deterministic dependency management.
    *   **Google Cloud SDK (`gcloud`):** Required for authentication and interacting with GCP services (Logging, Vertex AI).
    *   **Playwright Browsers:** The pipeline requires Chromium for the "Computer Use" environment.

## 2. Project Setup

### Clone and Install
Initialize the project environment using `uv`.

```bash
cd computer-use-eval

# 1. Sync python dependencies
uv sync

# 2. Install Playwright system dependencies and browsers
uv run playwright install chromium
# If on a fresh Linux VM (e.g., Cloud Workstation):
uv run playwright install-deps chromium
```

### Authentication (`gcloud`)
The pipeline uses Application Default Credentials (ADC) to talk to Vertex AI and Logging.

```bash
# Login to Google Cloud
gcloud auth login

# Set your project (where Vertex AI API is enabled)
gcloud config set project YOUR_PROJECT_ID

# Generate Application Default Credentials
gcloud auth application-default login
```

## 3. Configuration (`.env`)

The pipeline supports two authentication modes: **Vertex AI (GCP)** for enterprise workloads and **Google AI Studio (API Key)** for rapid prototyping.

Create a `.env` file in the `computer-use-eval/` root.

### Option A: Vertex AI (Enterprise / Default)
Requires `gcloud auth application-default login` setup (see above). Best for large-scale evals and BigQuery integration.

```env
# --- Identity ---
GCP_PROJECT_ID="your-project-id"
GCP_REGION="us-central1"

# --- Storage (Critical for Video Judge) ---
# Required for Vertex AI to analyze videos.
# Must be a standard GCS bucket in the same project.
GCP_GCS_BUCKET="your-staging-bucket-name"

# --- Models ---
GCP_MODEL_NAME="gemini-3.0-flash-preview"
GCP_JUDGE_MODEL="gemini-3.0-pro-preview"
# Enable Vertex AI GenAI Evaluation Service
GCP_USE_VERTEX_EVAL=false

### ⚠️ Data Hygiene & Cost Management (Critical)
The "Video Judge" uploads evaluation videos to your GCS bucket for multimodal analysis. These files are typically 5-20MB each and can accumulate quickly in high-volume batch runs. 
**To avoid unnecessary storage costs**, we recommend applying a **1-Day Retention Policy** to automatically delete old videos after analysis is complete.

**Run the auto-setup script:**
```bash
./scripts/setup_gcs_lifecycle.sh
```
*Alternatively, configure the Lifecycle rule manually in the Cloud Console.*
```

### Option B: Google AI Studio (Prototyping)
Uses an API Key. Easier to set up but may have lower rate limits. **Does NOT require GCS or gcloud.**

```env
# --- Identity ---
GCP_API_KEY="AIzaSy..."

# --- Models ---
GCP_MODEL_NAME="gemini-3.0-flash-preview"
GCP_JUDGE_MODEL="gemini-3.0-pro-preview"
```

### Common Configuration (All Modes)

```env
# --- Execution ---
# Set to 'false' to watch the browser UI in real-time
GCP_HEADLESS_MODE=true

# Safety Policy: 'auto' (default), 'interactive', 'auto-approve', 'auto-deny'
GCP_SAFETY_MODE="auto"

# --- Reporting ---
# Export results to BigQuery (Requires GCP Project ID even in API Key mode)
# GCP_ENABLE_BIGQUERY=true
# GCP_BIGQUERY_DATASET="computer_use_evals"
```

## 4. Vertex AI Sandbox (Enterprise / Private Preview)
To run the agent in a secure, remote Vertex AI Sandbox **instead of** the local Playwright environment (mutually exclusive). Note: This feature is currently in **Private Preview**.

1.  **Enable the Feature:**
    ```env
    GCP_USE_SANDBOX=true
    ```
2.  **Configure Service Account:**
    The sandbox needs a Service Account with `roles/iam.serviceAccountTokenCreator` to generate authentication headers.
    ```env
    GCP_SANDBOX_SERVICE_ACCOUNT="my-sa@my-project.iam.gserviceaccount.com"
    ```
3.  **Private Preview Configuration:**
    If you are part of the Private Preview using a specific API endpoint (e.g., Autopush), override the base URL:
    ```env
    GCP_VERTEX_API_BASE_URL="https://us-central1-autopush-aiplatform.sandbox.googleapis.com/"
    ```

