# FinOps Agent 🚀

Welcome to the FinOps Agent repository! This project is a powerful, open-source agent designed to help organizations of all sizes master their cloud spend. It analyzes massive amounts of cloud billing data, identifies waste, and provides actionable optimization recommendations in plain English.

This repo is designed to be a starting point for building intelligent FinOps assistants that can bridge the gap between raw billing numbers and corporate cloud policies, making cloud financial management accessible to everyone from developers to C-level executives.

## The Value: Why Use This Repo?

Cloud billing data is notoriously complex, often spanning tens of thousands of rows with cryptic SKU names and usage metrics. Traditional dashboards give you charts, but they don't answer the *why* or *how* to fix it.

**This agent changes that.** It allows anyone at any business level to ask natural language questions and get immediate, expert-level answers about their cloud footprint.

## Key Capabilities

The FinOps Agent acts as a **Senior GCP Forensic Architect**. Instead of relying on a single model to answer complex financial and technical questions, it uses a **Multi-Agent Orchestration** approach to deliver high-quality results:

*   **Ultimate BigQuery Flexibility**: The agent can answer **any question on any billing data**. It does not require a rigid, specific schema. Because it generates SQL queries on the fly (NL2SQL), it adapts to *your* data structure, allowing it to analyze tens of thousands of rows to find patterns, anomalies, and waste.
*   **Policy-Aware Insights**: It doesn't just look at numbers; it checks them against your corporate policies.
*   **Automated Visualization**: It generates data charts automatically when requested to make trends easy to spot.
*   **Synthesized Reports**: It combines raw data and policy context into a final, human-readable report with actionable recommendations.

---

## How It Works (Under the Hood)

When you ask a question, the **Orchestrator** analyzes the intent and routes sub-tasks to specialized agents:

1.  **Structured Data Agent**: Queries your BigQuery billing data. Again, this is highly flexible and can adapt to various schemas.
2.  **Unstructured Data Agent**: Searches your corporate documentation and policies via Agent Search (formerly Vertex AI Search and Conversation).
3.  **Visual Specialist**: Generates charts and visual representations of data.
4.  **Synthesis Agent**: Combines all insights into the final report.

---

## Setup Requirements

### 1. BigQuery (Billing Data)
You need to load your cloud cost data into a BigQuery table within a dataset. Because the agent is highly flexible and generates SQL dynamically, you can point it at standard GCP billing exports or custom cost tables. It will inspect your schema and generate the appropriate queries to answer your questions.

**How to set it up:**
*   Follow the official Google Cloud quickstart guide to create a dataset and load your data: [Load data with the console](https://docs.cloud.google.com/bigquery/docs/quickstarts/load-data-console).

### 2. Agent Search (datastore for Policies)
To answer questions about your company's specific cloud governance policies (e.g., "Are we allowed to use multi-region buckets?"), the agent relies on an Agent Search datastore.

**How to set it up:**
1.  Put your policy documents (PDFs, Markdown, TXT, etc.) into a **Cloud Storage bucket**.
2.  Create a datastore in Agent Search (formerly Vertex AI Search and Conversation) and connect it to your bucket.
3.  Follow the official Google Cloud documentation for detailed steps: [Create a Data Store using Cloud Storage](https://docs.cloud.google.com/generative-ai-app-builder/docs/create-data-store-es#cloud-storage).

---

## Sample Data for Quick Start

To help you get started quickly without needing live billing data, we have included sample files in the **`synth-data/`** folder of this repository:

### 1. `synth-data/sample_billing_data.csv`
This file contains 500 rows of simulated, highly varied billing data. You can load this CSV file directly into a BigQuery table to test the agent's analytical capabilities.
*   **Usage**: Follow the BigQuery link in the setup section above to create a table and upload this CSV.

### 2. `synth-data/ACME business document.pdf`
This document contains sample corporate policies and guardrails.
*   **Usage**: Upload this file to a Cloud Storage bucket and connect it to your Agent Search datastore as described in the setup section.

---

## Prerequisites

To run this agent, you need:
1.  The **Agent Development Kit (ADK)** installed.
2.  A **Google Cloud Project** with billing enabled.
3.  **IAM Permissions**: Your user account or service account must have read access to the BigQuery dataset/table and the Agent Search datastore.
4.  **Local Authentication**: You should have the Google Cloud SDK installed and authenticated locally. Run `gcloud auth application-default login` to ensure the agent can access your GCP resources.

## Installation

Follow these steps to set up your local environment:

### 1. Create a Virtual Environment
It is highly recommended to use a virtual environment to isolate the dependencies of this project from your global Python installation.
```bash
python3 -m venv .venv
```

### 2. Activate the Virtual Environment
You need to activate the environment so that your terminal uses the project-specific Python and package manager.
```bash
source .venv/bin/activate
```

### 3. Install Requirements
Install all the necessary dependencies, including the `google-adk` and other required libraries.
```bash
pip install -r requirements.txt
```
*   **Why**: This ensures that you have the exact versions of the libraries needed for the agent to function correctly, including the ADK tools for running and serving the agent.

---

## How to Run

### 1. Start the Chat Interface

To interact with the agent via a web-based chat interface, run the following command in the project root:

```bash
adk web .
```
*   **What it does**: This starts a local web server and provides a link to a chat interface where you can interact with the agent visually.
*   **Note**: This command runs a persistent server. If you want to continue using the terminal for other commands while the server is running, you should open a **new terminal window** and activate the environment there.

### 2. Run the Agent in the Terminal (Interactive Mode)

If you prefer to interact with the agent directly in your terminal without a web UI, you can use the `adk run` command. You must provide the path to the folder containing the agent code (which is `agent` in this repo):

```bash
adk run agent
```
*   **What it does**: This enters an interactive CLI session where you can type queries and see the agent's step-by-step reasoning and final answers directly in the terminal.

You can also run a single query and exit by adding the query in quotes:
```bash
adk run agent "What are our top spending projects?"
```

---

## Configuration

The agent's behavior and data access are controlled entirely by environment variables. You do not need to create a new file; simply **modify the existing `.env` file** already present in the root of this repository with your own project variables.

Here is the template used in the `.env` file:

```env
# GCP Project Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1

# BigQuery Configuration
BQ_DATA_PROJECT_ID=your-project-id
BQ_DATASET_ID=your-dataset-id
BQ_TABLE_ID=your-project-id.your-dataset-id.your-table-id

# Agent Search / datastore Configuration
ACME_DATASTORE_ID=projects/your-project-id/locations/global/collections/default_collection/dataStores/your-datastore-id

# Model Configuration
ROOT_AGENT_MODEL=gemini-2.5-flash
GOOGLE_GENAI_USE_VERTEXAI=True
PORT=8080
```
*   **Security Note**: Never commit your actual `.env` file with real project IDs or credentials to a public repository!
