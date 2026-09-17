#!/bin/bash

# ADK2 Graph Asset - Executable Scripts Reference
# 
# This is a guide to all executable files in the project

cat << 'EOF'

╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║              ADK2 Graph Asset - Executable Files Reference                ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

QUICK START
───────────────────────────────────────────────────────────────────────────

1. FIRST TIME SETUP (Recommended)
   ➜ ./quickstart.sh
   
   What it does:
   • Checks prerequisites (gcloud, python, gsutil)
   • Authenticates with Google Cloud
   • Creates staging bucket
   • Sets up Python environment
   • Runs local test
   • Optionally deploys first agent
   
   Time: ~5-10 minutes


2. VERIFY YOUR ENVIRONMENT
   ➜ ./validate-setup.sh
   
   What it does:
   • Checks all required tools installed
   • Verifies GCP authentication
   • Confirms APIs are enabled
   • Validates Python dependencies
   • Checks configuration files
   • Tests bucket access
   
   Use when: Troubleshooting issues


3. PRODUCTION DEPLOYMENT
   ➜ ./deployment-agent.sh -p my-project-id
   
   What it does:
   • Validates all prerequisites
   • Creates/verifies staging bucket
   • Sets up Python environment
   • Validates YAML configuration
   • Deploys agent to Agent Engine
   • Shows deployment status
   
   Options:
   -p, --project PROJECT_ID     GCP Project ID (required)
   -r, --region REGION          Vertex AI region (us-central1)
   -b, --bucket BUCKET_NAME     Custom bucket name
   -y, --yaml YAML_FILE         Custom YAML file
   -n, --name AGENT_NAME        Custom agent name
   -s, --skip-checks            Skip GCP checks
   -h, --help                   Show help


PYTHON SCRIPTS
───────────────────────────────────────────────────────────────────────────

1. DEPLOYMENT (Enhanced)
   ➜ python main_enhanced.py [yaml_file] [agent_name]
   
   What it does:
   • Validates configuration from environment
   • Initializes Vertex AI
   • Validates YAML schema
   • Deploys to Agent Engine
   • Provides detailed feedback
   
   Examples:
   python main_enhanced.py agent/sample_graph.yaml
   python main_enhanced.py my_agent.yaml MyAgent
   
   Requires: .env file with configuration


2. DEPLOYMENT (Original - for compatibility)
   ➜ python main.py [yaml_file] [agent_name]
   
   This is the original version. Use main_enhanced.py for better
   error messages and validation.


3. LOCAL TESTING
   ➜ python localtest.py [yaml_file] [message]
   
   What it does:
   • Tests agent locally (no GCP deployment)
   • Loads YAML configuration
   • Runs agent with test inputs
   • Shows agent response
   
   Examples:
   python localtest.py                           # Uses defaults
   python localtest.py my_agent.yaml             # Custom YAML
   python localtest.py agent/sample_graph.yaml "Custom message"


CONFIGURATION
───────────────────────────────────────────────────────────────────────────

REQUIRED ENVIRONMENT VARIABLES
Set in agent/.env:

  GOOGLE_CLOUD_PROJECT        Your GCP Project ID
  STAGING_BUCKET              gs://bucket-name for staging agent code

OPTIONAL ENVIRONMENT VARIABLES

  GOOGLE_CLOUD_LOCATION       Vertex AI region (default: us-central1)
  GOOGLE_APPLICATION_CREDENTIALS  Path to service account key


SETUP TEMPLATE
───────────────────────────────────────────────────────────────────────────

Create agent/.env from template:
  ➜ cp agent/.env.example agent/.env
  ➜ nano agent/.env  # Edit with your values


DEPLOYMENT PIPELINE (Google Cloud Build)
───────────────────────────────────────────────────────────────────────────

Automated deployment via Google Cloud Build:

  ➜ gcloud builds submit \
      --config=cloudbuild.yaml \
      --substitutions=_LOCATION=us-central1,_AGENT_DISPLAY_NAME=MyAgent

This automatically:
  • Validates configuration
  • Sets up Python environment
  • Runs tests
  • Validates YAML
  • Checks GCP prerequisites
  • Deploys agent
  • Reports results


TYPICAL WORKFLOWS
───────────────────────────────────────────────────────────────────────────

WORKFLOW 1: First-Time Deployment
  ┌─────────────────────────────────────────┐
  │ 1. ./validate-setup.sh                  │  Check environment
  │ 2. ./quickstart.sh                      │  Interactive setup
  │ 3. Agent deployed! ✓                    │
  └─────────────────────────────────────────┘


WORKFLOW 2: Recurring Deployments
  ┌─────────────────────────────────────────┐
  │ 1. ./deployment-agent.sh -p PROJECT_ID  │  Full deployment
  │ 2. Edit agent YAML as needed            │
  │ 3. Re-run deployment script              │
  │ 4. View results                          │
  └─────────────────────────────────────────┘


WORKFLOW 3: Development/Testing
  ┌─────────────────────────────────────────┐
  │ 1. source venv/bin/activate             │  Activate env
  │ 2. python localtest.py my_agent.yaml    │  Test locally
  │ 3. Fix/iterate until working            │
  │ 4. python main_enhanced.py my_agent.yaml│  Deploy
  │ 5. Test deployed agent                  │
  └─────────────────────────────────────────┘


WORKFLOW 4: CI/CD Pipeline
  ┌──────────────────────────────────────────────┐
  │ 1. Push code with cloudbuild.yaml           │  Trigger build
  │ 2. Cloud Build validates configuration      │
  │ 3. Runs tests                               │
  │ 4. Validates YAML schema                    │
  │ 5. Auto-deploys on success                  │
  └──────────────────────────────────────────────┘


COMMAND CHEAT SHEET
───────────────────────────────────────────────────────────────────────────

Initial Setup
  ./validate-setup.sh                    Check if ready
  ./quickstart.sh                        Interactive setup
  cp agent/.env.example agent/.env       Create config

Testing
  source venv/bin/activate               Activate Python env
  python localtest.py                    Test locally
  ./validate-setup.sh                    Validate environment

Deployment
  ./deployment-agent.sh -p PROJECT_ID    Full deployment
  python main_enhanced.py my_agent.yaml  Direct Python deploy
  gcloud builds submit --config=...      CI/CD deployment

Monitoring
  gcloud logging read --limit 50         View deployment logs
  gcloud aiplatform agents list          List deployed agents


TROUBLESHOOTING
───────────────────────────────────────────────────────────────────────────

Problem: "Command not found: gcloud"
Solution: Install Google Cloud SDK
  macOS: brew install gcloud-sdk
  Linux: curl https://sdk.cloud.google.com | bash

Problem: "Not authenticated with GCP"
Solution: Run authentication
  gcloud auth application-default login

Problem: "GOOGLE_CLOUD_PROJECT is required"
Solution: Set environment variable
  export GOOGLE_CLOUD_PROJECT=your-project-id
  Or add to agent/.env

Problem: "Staging bucket not found"
Solution: Create bucket
  gsutil mb -p PROJECT_ID -l us-central1 gs://PROJECT_ID-adk2-staging

Problem: Validation fails
Solution: Run comprehensive check
  ./validate-setup.sh

Problem: Local test hangs
Solution: Check GCP setup
  gcloud services enable aiplatform.googleapis.com
  ./validate-setup.sh


GETTING HELP
───────────────────────────────────────────────────────────────────────────

View script help:
  ./quickstart.sh -h
  ./deployment-agent.sh -h
  ./validate-setup.sh -h
  python main_enhanced.py -h

View configuration template:
  cat agent/.env.example

View documentation:
  cat DEPLOYMENT_GUIDE.md
  cat README.md


PROJECT STRUCTURE
───────────────────────────────────────────────────────────────────────────

agent/
  ├── .env                  ← Your configuration (edit this)
  ├── .env.example          ← Configuration template
  ├── adk_agent.py          ← Agent implementation
  ├── gcp_config.py         ← GCP setup
  ├── graph_builder.py      ← YAML to ADK2 converter
  ├── requirements.txt      ← Python dependencies
  └── sample_graph.yaml     ← Example agent

Root directory:
  ├── quickstart.sh         ← Run this first
  ├── deployment-agent.sh   ← Production deployment
  ├── validate-setup.sh     ← Verify setup
  ├── cloudbuild.yaml       ← CI/CD configuration
  ├── main_enhanced.py      ← Enhanced deployment tool
  ├── main.py               ← Original deployment tool
  ├── localtest.py          ← Local testing
  ├── README.md             ← Project info
  └── DEPLOYMENT_GUIDE.md   ← This guide


VERSION INFORMATION
───────────────────────────────────────────────────────────────────────────

Current Version:     0.2.0
Last Updated:        May 2026
Python Required:     3.10+
Google Cloud SDK:    Latest (gcloud --version)
ADK Version:         2.0 Alpha (google-adk>=2.0.0a1)


═════════════════════════════════════════════════════════════════════════════

Questions? Run: ./validate-setup.sh
Need help? View: DEPLOYMENT_GUIDE.md
Ready to deploy? Run: ./quickstart.sh

═════════════════════════════════════════════════════════════════════════════

EOF
