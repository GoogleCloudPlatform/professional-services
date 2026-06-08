# Enterprise Environment Provisioning & System Setup Guide

## Executive Summary & Setup Philosophy

This document outlines the step-by-step blueprints for initializing and running the conversational AI platform, both in localized hot-reloading development sandboxes and within a secure, containerized Google Cloud production topology. 

To enable seamless development cycles, the platform's environment is decoupled into a **Local Hot-Reload plane** (powered by local Go servers and Vite/React hot compilers) and a **Google Cloud Resource plane** (handling Vertex AI search, Secret Manager securely, and Cloud Run compute instances), connected via secure credentials.

---

## 1. Prerequisites & System Toolchains

Ensure your local development environment is provisioned with the following system-level toolchains:

| Toolchain | Required Version | Purpose |
| :--- | :--- | :--- |
| **Go compiler** | `v1.25.0+` | Core backend proxy and MCP server compilation. |
| **Node.js** | `v22.0.0+` | React frontend bundling and local Vite compilation. |
| **Google Cloud CLI (`gcloud`)** | Latest | Identity access management and cloud credential handshakes. |
| **Terraform** | Latest | Declarative infrastructure-as-code resource bootstrapping. |

Verify installation and compile both the frontend and Go backend modules by running:
```bash
make install
```

---

## 2. Gcloud Credentials, ADC, and Quota Project Binding

Connecting your local proxy server securely to Vertex AI Live APIs requires establishing server-side authentication without hardcoding or leaking long-lived service account JSON keys. 

We utilize **Application Default Credentials (ADC)** in tandem with **Quota Project Bindings** to ensure your local queries are metered against your specific Google Cloud project, preventing standard quota exhaustion errors.

```
┌────────────────────────────────────────────────────────┐
│             LOCAL AUTHENTICATION & CREDENTIAL FLOW     │
│                                                        │
│ [Local Client CLI] ───(gcloud login)───► [GCP IAM]     │
│                                              │         │
│                                              ▼ (Sets)  │
│ [ADC Credentials File] ◄─────────────────────┘         │
│                                                        │
│ [Local Go Proxy] ─────(Reads ADC)─────► [Inject Token] │
└────────────────────────────────────────────────────────┘
```

1.  **Authorize your local terminal:**
    ```bash
    gcloud auth login
    ```
2.  **Generate local Application Default Credentials (ADC):**
    ```bash
    gcloud auth application-default login
    ```
3.  **Bind the Billing/Quota Project ID:**
    ```bash
    gcloud auth application-default set-quota-project YOUR_PROJECT_ID
    gcloud config set project YOUR_PROJECT_ID
    ```
    *This generates an authorized local JSON credential file in your machine's system configuration folder (`~/.config/gcloud/application_default_credentials.json`), allowing Go's GCP SDKs to automatically find and use these credentials at runtime.*

4.  **Firestore Provisioning Guardrail (Critical):**
    You must ensure that **Google Cloud Firestore** is explicitly provisioned in **Native Mode** inside the *same* active Google Cloud Project scope (`YOUR_PROJECT_ID`) configured in your CLI. If Firestore is uninitialized or configured in Datastore mode, the Go scenario service will fail to instantiate during startup.

---

## 3. Local Environment Variables vs. Secret Manager

Local environment variables are managed via a `.env` file at the root of the workspace. 

### 3.1 Local Environment Configuration (`.env`)
Generate your local environment file:
```bash
cp .env.example .env
```
Provide the required local configuration parameters inside `.env`:
*   `GEMINI_LIVE_API_KEY`: Generatable within Google AI Studio.
*   `HEYGEN_API_KEY`: Generatable within your HeyGen administrative dashboard.
*   `VITE_API_BASE_URL`: For purely local development, configure this to `http://localhost:8080/api`.
*   `COMPANY_NAME`: Controls global prompt compilation. Set this to `"Cymbal Bank"` or `"Commercial Bank of Cymbal"` to ensure proper branding. If empty, the system falls back to `"CSB Commercial Banking"`.
*   `SCENARIO_CACHE_TTL_MINUTES`: Optional. Controls scenario memory cache lifetime (defaults to `5` minutes).
*   `VERTEX_SEARCH_LOCATION`: Optional. Regional location scope for Vertex AI Search (defaults to standard `global`).

### 3.2 Secure Secret Manager Configuration
To deploy the application to Cloud Run without exposing active API keys in plain text inside your container environments, keys must be pushed to GCP Secret Manager. The bootstrap script automates this:
```bash
make secrets
```
This provisions `GEMINI_LIVE_API_KEY` and `HEYGEN_API_KEY` inside Secret Manager. At startup, the Cloud Run instance automatically maps these secrets as secure environment files, keeping production credentials isolated from your codebase.

### 3.3 Advanced Configuration: Voice Activity Detection (VAD)
The system's responsiveness is highly dependent on Voice Activity Detection sensitivity and silence timeouts. By default, these are configured for a snappy, fast-paced executive demo environment.

If you need to adjust the silence timeout before the agent responds (e.g., to allow users to pause longer for breath), you can modify the VAD settings in your `.env` file:
*   **Demo Default (`600ms`):** The sweet spot for structured demos. It feels fast but allows for brief natural pauses.
*   **Aggressive (`400ms`):** Very snappy, but forces the user to speak quickly without pauses.
*   **Production/Natural (`800ms - 1200ms`):** Recommended for real-world or unstructured user testing where users may have longer cognitive pauses.

Additionally, `startOfSpeechSensitivity` and `endOfSpeechSensitivity` are configured to `START_SENSITIVITY_HIGH` and `END_SENSITIVITY_HIGH` respectively, ensuring the microphone catches quiet speech in demo environments.

---

## 4. Terraform Infrastructure Bootstrapping

We manage Google Cloud resources declaratively through the provided Terraform configurations (`infra/`). 

```
                       ┌─────────────────────────┐
                       │    make deploy (TF)     │
                       └────────────┬────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│ Cloud Run       │        │ Secret Manager  │        │ Vertex Search   │
│ Compute Engine  │        │ Secure Keys     │        │ Data Stores     │
└─────────────────┘        └─────────────────┘        └─────────────────┘
```

The bootstrap command executes the deployment cycle:
```bash
make deploy
```
This orchestrates the following infrastructure tasks:
1.  **Secret Containers:** Provisions Secret Manager containers for your API keys.
2.  **Vertex Search Data Store:** Provisions an enterprise-grade semantic grounding search datastore (`Discovery Engine`).
3.  **Cloud Run Compute Engine:** Builds the Go container image, deploys it to a secure Serverless Cloud Run service, and exposes regional HTTP/WebSocket endpoints.
4.  **Auto-Updated Environment:** The deployment script captures the newly generated cloud resource identifiers and automatically updates your local `.env` file with `VERTEX_PROJECT_ID`, `VERTEX_LOCATION`, `VERTEX_ENGINE_ID`, and `VERTEX_DATA_STORE_ID`.

---

## 5. Grounding Knowledge Base Seeding Pipeline

To ground your advisors in specialized financial, real estate, and cross-border guide PDF documents, you must seed the Vertex Search datastore. 

```
 [Local PDFs (data/)]
         │
         ▼ (Parsed and Encoded)
 [seed_firestore.go] ─────► [Firestore Records (Base Scenarios)]
         │
         ▼ (Uploaded & Indexed)
 [Vertex AI Search (Discovery Engine)]
```

*   **Prerequisite:** You must run `make deploy` first so that the Vertex Search Data Store is fully provisioned in Google Cloud.
*   **Execution:** Run the data seeding pipeline:
    ```bash
    make seed
    ```
*   **Under the Hood:** This command executes `scripts/seed_firestore.go` to parse the banking knowledge-base PDFs located in `data/`, index them, and upload them to your Google Discovery Engine Datastore. It also writes the initialized base scenarios directly into Firestore, priming your cloud advisor database.

---

## 6. Local and Proxy Execution Modalities

Once system setup and data seeding are complete, you can start the application using one of two execution paths:

### Modality A: Fully Local Hot-Reloading Sandbox
Best for core development, UI tweaks, and adding custom tools. Both the React/Vite development server and Go backend (managed via `air` for hot-reloading) run concurrently.

1.  Verify `.env` has:
    ```bash
    VITE_API_BASE_URL=http://localhost:8080/api
    ```
2.  Start the local sandbox:
    ```bash
    make dev
    ```
3.  Open `http://localhost:5173` to test.

### Modality B: Local UI with Cloud Run Backend Proxy
Best for testing frontend visual changes against your live, production Cloud Run backend without needing to redeploy or re-build the container image.

1.  Set `.env` base URL to the local proxy:
    ```bash
    VITE_API_BASE_URL=http://localhost:8081/api
    ```
2.  Launch the authenticated cloud tunnel proxy:
    ```bash
    make proxy
    ```
3.  In a separate terminal, launch only the React frontend server:
    ```bash
    cd frontend && npm run dev
    ```
4.  Open `http://localhost:5173` in your browser. All API and WebSocket queries are routed locally to `localhost:8081`, which proxies them securely through the active gcloud tunnel directly to your live Cloud Run instance in Google Cloud.