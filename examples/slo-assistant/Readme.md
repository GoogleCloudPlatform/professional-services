# AI-Powered SLO Consultant

> **Automated Site Reliability Engineering (SRE) Agent**
>
> Use your application code to indentify deployment-ready Service Level Objectives (SLOs) through Terraform in minutes using Google Gemini.

## Overview

The **AI-Powered SLO Consultant** is an intelligent workflow tool designed to bridge the gap between application code and reliability engineering. Instead of manually digging through code to understand dependencies, drawing architecture diagrams, and writing complex Terraform configurations, this agent does it for you.

It acts as a "Human-in-the-Loop" wizard, guiding you through 5 stages of reliability design:

1.  **Repo Analysis:** Understands your file structure.
2.  **Journey Discovery:** Identifies Critical User Journeys (CUJs) from code.
3.  **Visualization:** Draws MermaidJS sequence diagrams for every journey.
4.  **SLO Design:** Drafts detailed SLO specs (Availability, Latency, Error Budgets).
5.  **Infrastructure as Code:** Generates the actual Terraform to deploy these monitors to Google Cloud.

---

## Key Features

- **🤖 Goal-Driven Auto-Pilot:** Don't want to click buttons? Just tell the chat _"Generate Terraform for this repo,"_ and the agent will intelligently execute the entire pipeline step-by-step, pausing for your confirmation at critical checkpoints.
- **🗣️ Guided Discovery:** You can provide context _before_ the analysis starts. Tell the agent, _"Focus on the login and checkout flows,"_ and it will prioritize those journeys during the discovery phase.
- **✨ Smart Refinement:** A built-in chat assistant allows you to refine artifacts using natural language. Ask it to _"Add a Redis cache to the checkout diagram"_ or _"Make the latency target stricter,"_ and it will draft the edits for you.
- **✅ Interactive Proposals:** All AI-suggested changes (whether to diagrams, SLOs, or the Journey List) are presented as **Proposals**. You can review the "Before vs. After" difference in a clean UI before accepting or discarding the change.
- **🔍 Code-to-Journey Analysis:** Automatically parses repositories (Java, Go, Python, etc.) to find API endpoints and critical paths with option to target specific **branches** or **sub-folders** within a repository for a more focused analysis.
- **📊 Auto-Diagramming:** Generates **MermaidJS Sequence Diagrams** by tracing function calls and service dependencies in your code.
- **📝 Automated SLO Specs:** Writes professional Markdown design docs defining SLIs, SLO targets, and error budget policies.
- **🏗️ Terraform Generation:** Converts abstract SLO designs into valid, ready-to-apply terraform code for Google Cloud Monitoring.
- **☁️ Cloud Sync:** Automatically uploads all artifacts (Diagrams, Docs, Terraform files) to a **Google Cloud Storage (GCS)** bucket for persistence and auditing.
- **✨ Interactive UI:** A clean **Streamlit** interface that allows you to review, edit, and refine the AI's output at every step.

---

## Getting Started

### Prerequisites

- **Python 3.10+**
- **Google Cloud Project** with Vertex AI API enabled.
- **Google Cloud Storage Bucket** (to store generated artifacts).

### 1. Clone the Repository

```bash
git clone <<repo url>>
cd slo-assistant
```

### 2. Set up Virtual Environment

```bash
python -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install .
```

### 4. Configure Environment Variables

Create a .env file in the root directory:

```bash
touch .env
```

Add the following configuration variables:

```text
# GCP Project ID
GCP_PROJECT_ID=your-gcp-project-id

# Storage Configuration
GCP_BUCKET_NAME=your-storage-bucket-name
```

## Development & Testing

This project uses `pytest` for testing, `black` for code formatting, and `pylint` for linting.

### Running Tests
To run the test suite and generate a coverage report:
```bash
make test
```

### Formatting & Linting
To ensure code quality and consistency, run `make format` (which uses `black` with a line length of 100) and `make lint` (which uses `pylint`):
```bash
# Format code
make format

# Run linter
make lint
```

## Usage

The application uses a decoupled architecture with a FastAPI backend and a Streamlit frontend. 

To start both servers simultaneously and handle port availability automatically, use the provided bash script:

```bash
./run.sh
```

The script will:
1. Start the FastAPI backend server (default port 8080).
2. Start the Streamlit UI (default port 8501).
3. Automatically find the next available port if the default ports are in use.

The UI will open in your browser at the URL provided in the terminal output (e.g., http://localhost:8501).

### The Workflow

#### Mode A: Manual Wizard (Click-Through)

- **Configuration:** Enter your Git Repository URL (e.g., `https://github.com/GoogleCloudPlatform/microservices-demo`).
- **Start or Resume**:
  - **New Session**: Enter your Git URL and Begin with step 1. The app generates a unique Session ID automatically.
  - **Resume**: Paste an existing Session ID into the sidebar to restore your progress. The app automatically re-clones the repo and loads your previous state (CUJs, Diagrams, SLOs) from the cloud.
- **Step 1 - Analysis:** Click **Clone & Analyze** to load the file structure.
- **Step 2 - CUJs:** Click **Identify CUJs**. Review the identified journeys. You can **Edit** the names or files if the AI missed something.
- **Step 3 - Diagrams:** Generate architecture diagrams. View them in the tabs to ensure the flow is correct.
- **Step 4 - SLO Design:** The agent will draft an SLO document. Use the **Edit** mode to tweak targets (e.g., change 99.9% to 99.99%).
- **Step 5 - Terraform:** Generate the final infrastructure code. Download the files or view them in your GCS bucket.

#### Mode B: Chat-Driven (Auto-Pilot)

1. **Start:** Enter your Git URL.
2. **Command:** Type a goal into the chat sidebar, such as:
   - _"Identify the Critical User Journeys"_
   - _"Generate the full Terraform configuration for this repo."_
3. **Interact:** The agent will perform the work and present **Proposals**.
   - It will ask: _"I've identified 5 journeys. Shall I proceed to diagrams?"_
   - You can reply: _"Yes"_ or _"Wait, rename 'Login' to 'Auth' first."_

### Interactive Controls

- **View vs. Edit:** Toggle between a read-only preview and a raw text editor for every artifact.
- **Proposal UI:** A dedicated card view to Accept or Discard AI-generated changes safely.
- **Cloud Console Links:** Direct links to the generated artifacts in your Google Cloud Storage bucket are provided at every step for easy auditing.
