# ADK2 Graph Asset - LLM Agent Deployment Tool

> **Deploy AI agents to Google Cloud Vertex AI in minutes using simple YAML definitions**

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue)](https://www.python.org/downloads/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Vertex%20AI-orange)](https://cloud.google.com/vertex-ai)
[![ADK 2.0](https://img.shields.io/badge/ADK-2.0%20Alpha-yellow)](https://github.com/googleapis/python-adk)
[![Status](https://img.shields.io/badge/Status-Alpha-red)](#status)

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Local Testing](#local-testing)
- [Production Deployment](#production-deployment)
- [YAML Schema](#yaml-schema)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Support](#support)

---

## Overview

**ADK2 Graph Asset** is a production-ready tool that transforms YAML-defined LLM workflows into deployable Google Cloud agents. It bridges the gap between workflow design and cloud deployment by handling:

✅ **YAML-to-ADK2 Conversion** - Parse workflow definitions in human-readable YAML  
✅ **Multi-node Workflows** - Chain multiple LLM calls with custom logic  
✅ **Automatic Deployment** - Deploy to Vertex AI Agent Engine with one command  
✅ **Session Management** - Automatic persistent conversation memory  
✅ **Cloud Tracing** - Built-in observability and telemetry  
✅ **Local Development** - Test locally before cloud deployment  

### Use Cases

- **Customer Service Agents** - Multi-turn conversations with context
- **Data Analysis Workflows** - Chain LLM calls for complex tasks
- **Automated Assistants** - Long-running agents with memory
- **Research Tools** - Orchestrate multiple AI models

---

## Architecture

```
User YAML Definition
        ↓
   ┌─────────────────────────────────────┐
   │   Graph Builder (graph_builder.py)  │
   │   • Parse YAML schema               │
   │   • Extract LLM configurations      │
   │   • Build workflow topology         │
   └─────────────────────────────────────┘
        ↓
   ┌─────────────────────────────────────┐
   │   ADK2 Agent (adk_agent.py)         │
   │   • Create Agent/Workflow objects   │
   │   • Handle session lifecycle        │
   │   • Execute LLM chains              │
   └─────────────────────────────────────┘
        ↓
   ┌─────────────────────────────────────┐
   │   GCP Deployment (main.py)          │
   │   • Validate configuration          │
   │   • Upload to Cloud Build           │
   │   • Deploy to Agent Engine          │
   └─────────────────────────────────────┘
        ↓
   Vertex AI Agent Engine (Production)
   • REST API endpoint
   • Automatic scaling
   • Session persistence
   • Cloud Trace integration
```

---

## Prerequisites

### System Requirements
- **Python**: 3.10 or later
- **OS**: macOS, Linux, or Windows (WSL2)
- **Disk Space**: ~500MB for dependencies

### Google Cloud Setup
- GCP project with billing enabled
- `gcloud` CLI installed ([install](https://cloud.google.com/sdk/docs/install))
- `gsutil` CLI installed (included with gcloud)

### Required GCP APIs
Enable these APIs in your project:
```bash
gcloud services enable \
  aiplatform.googleapis.com \
  cloudbuild.googleapis.com \
  cloudkms.googleapis.com \
  compute.googleapis.com
```

### Required IAM Roles
Your account needs:
- `roles/aiplatform.admin` - Deploy agents
- `roles/storage.objectAdmin` - Access staging bucket
- `roles/logging.viewer` - View logs (optional)

---

## Quick Start

### 1️⃣ Clone & Setup (5 minutes)

```bash
# Clone repository
git clone <repo-url>
cd adk2graph_asset

# Create Python environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r agent/requirements.txt
```

### 2️⃣ Configure GCP (5 minutes)

```bash
# Set your project ID
export PROJECT_ID=your-project-id

# Create staging bucket
gsutil mb -l us-central1 gs://$PROJECT_ID-adk2-staging

# Authenticate
gcloud auth application-default login
```

### 3️⃣ Configure Environment (2 minutes)

```bash
# Copy template
cp agent/.env.example agent/.env

# Edit with your values
cat > agent/.env << EOF
GOOGLE_CLOUD_PROJECT=$PROJECT_ID
STAGING_BUCKET=gs://$PROJECT_ID-adk2-staging
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=1
EOF
```

### 4️⃣ Test Locally (2 minutes)

```bash
# Run sample agent locally (no GCP deployment)
python localtest.py sample_graph.yaml

# Expected output:
# Vertex AI ready – project=your-project-id  location=us-central1
# Agent: JokeTellingAgentWithInputs
# [Agent response here]
```

### 5️⃣ Deploy to Cloud (5 minutes)

```bash
# Deploy to Vertex AI Agent Engine
python main.py sample_graph.yaml

# Output includes:
# ✓ Deployment successful!
# Resource Name: projects/xyz/locations/us-central1/agents/abc
```

**Total time: ~20 minutes** ⏱️

---

## Installation

### Detailed Setup Steps

#### Step 1: Clone Repository
```bash
git clone https://github.com/GoogleCloudPlatform/professional-services.git
cd professional-services/tools/adk2graph_asset
```

#### Step 2: Create Virtual Environment
```bash
# Create isolated Python environment
python3.10 -m venv venv

# Activate it
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows PowerShell
```

#### Step 3: Install Dependencies
```bash
# Upgrade pip
pip install --upgrade pip

# Install from requirements
pip install -r agent/requirements.txt

# Verify installation
python -c "import google.adk; print('ADK installed:', google.adk.__version__)"
```

#### Step 4: Verify GCP Setup
```bash
# Check gcloud authentication
gcloud auth list

# Check project ID
gcloud config get-value project

# Verify APIs are enabled
gcloud services list --enabled | grep aiplatform
```

---

## Configuration

### Environment Variables

Create `agent/.env` with these variables:

```env
# ═══════════════════════════════════════════════════════════════════════════
# REQUIRED - Set these values
# ═══════════════════════════════════════════════════════════════════════════

# Your GCP project ID (from: gcloud config get-value project)
GOOGLE_CLOUD_PROJECT=my-project-id

# GCS bucket for staging (must be accessible and in same region)
STAGING_BUCKET=gs://my-project-adk2-staging

# ═══════════════════════════════════════════════════════════════════════════
# OPTIONAL - Usually use defaults
# ═══════════════════════════════════════════════════════════════════════════

# Vertex AI region (default: us-central1)
# See: https://cloud.google.com/vertex-ai/docs/general/locations
GOOGLE_CLOUD_LOCATION=us-central1

# Use Vertex AI (not local Google AI Studio)
GOOGLE_GENAI_USE_VERTEXAI=1

# Enable Cloud Tracing and observability
GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true

# ═══════════════════════════════════════════════════════════════════════════
# OPTIONAL - Advanced authentication
# ═══════════════════════════════════════════════════════════════════════════

# Path to service account JSON (if not using Application Default Credentials)
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### Configuration Validation

Run the included validation script:
```bash
python -c "from agent.config import Config; Config.from_env().validate_gcp_prerequisites()"
```

Expected output:
```
✓ Authentication valid
✓ Staging bucket accessible
✓ Vertex AI API enabled
✓ Configuration valid
```

---

## Local Testing

### Test Without GCP Deployment

**Run the sample agent locally** (uses in-memory session storage):

```bash
python localtest.py
```

Output:
```
Vertex AI ready – project=my-project-id  location=us-central1
Agent: JokeTellingAgentWithInputs
Inputs: {'topic': 'text', 'place': 'text'}
User message: "Tell me a joke on programming and San Francisco"
────────────────────────────────────────────────────────────
I'd love to tell you a joke about programming and San Francisco!

Why did the programmer go to San Francisco?

Because he wanted to debug the Golden Gate Bridge... turns out it was just 
a networking issue! 🌉

[Continue with more jokes...]
```

### Test with Custom YAML

```bash
# Test custom workflow
python localtest.py my_workflow.yaml

# Test with custom message
python localtest.py my_workflow.yaml "Custom user input here"
```

### Debug Mode

```bash
# Enable verbose logging
PYTHONPATH=. python -u localtest.py sample_graph.yaml 2>&1 | tee debug.log
```

---

## Production Deployment

### Deploy to Vertex AI Agent Engine

```bash
# Deploy with auto-generated name from YAML
python main.py my_workflow.yaml

# Deploy with custom name
python main.py my_workflow.yaml "MyCustomAgent"

# Deploy with different bucket (override .env)
STAGING_BUCKET=gs://other-bucket python main.py my_workflow.yaml
```

### Automated Deployment with Cloud Build

Use the provided Cloud Build pipeline:

```bash
# Deploy using Cloud Build (recommended for CI/CD)
bash deployment-agent.sh deploy my_workflow.yaml

# View deployment logs
bash deployment-agent.sh logs
```

### Deployment Output

Successful deployment returns:
```
============================================================
✓ Deployment successful!
============================================================
Resource Name: projects/xyz/locations/us-central1/agents/abc-123-def
============================================================

API Endpoint: https://us-central1-aiplatform.googleapis.com/v1beta1/projects/xyz/locations/us-central1/agents/abc-123-def/query

To test deployed agent:
  gcloud ai agents query projects/xyz/locations/us-central1/agents/abc-123-def \
    --input="Your question here"

To enable persistent sessions:
  export AGENT_ENGINE_RESOURCE_NAME=projects/xyz/locations/us-central1/agents/abc-123-def
```

### Verify Deployment

```bash
# List all deployed agents
gcloud ai agents list --location=us-central1

# Query deployed agent
gcloud ai agents query \
  projects/YOUR_PROJECT/locations/us-central1/agents/YOUR_AGENT_ID \
  --input="Tell me a joke about Python"

# View agent logs
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=50 --format=json
```

---

## YAML Schema

### Complete Example

```yaml
version: "1.0"
kind: Agent

metadata:
  id: unique-agent-id
  name: MyCustomAgent
  description: Description of what this agent does
  owner_id: your-email@company.com

spec:
  # LLM Configurations
  llms:
    - id: llm-main
      provider: vertexai
      model: gemini-2.5-flash
      temperature: 0.7
      max_tokens: 2048
      top_p: 0.9
      
    - id: llm-analysis
      provider: vertexai
      model: gemini-2.5-pro
      temperature: 0.3
      max_tokens: 4096

  # Tool Definitions (for future extensibility)
  tools: []

  # Session Configuration
  memory:
    type: standard
    persistence: true

# Workflow Definition
workflow:
  nodes:
    # Start node (required)
    - id: start
      type: start

    # LLM Processing Node
    - id: main_assistant
      type: llm
      config:
        llm_id: llm-main
        instructions: >
          Process this request: {request}
          
          Provide a helpful response based on the context.
        system_prompt: >
          You are a helpful AI assistant. Always respond
          in a friendly and professional manner.
        tool_ids: []
        knowledge_ids: []
        
      inputs:
        - name: request
          type: text
        - name: context
          type: text
          
      outputs:
        - name: response
          type: text

    # Optional: Analysis Node
    - id: analysis
      type: llm
      config:
        llm_id: llm-analysis
        instructions: "Analyze: {response}"
        system_prompt: "Provide technical analysis."
      inputs:
        - name: response
          type: text

    # End node (required)
    - id: end
      type: end

  # Workflow Edges
  edges:
    - source: start
      target: main_assistant
    - source: main_assistant
      target: analysis
    - source: analysis
      target: end
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | ✅ | YAML schema version (always "1.0") |
| `kind` | string | ✅ | Must be "Agent" |
| `metadata.name` | string | ✅ | Agent display name (alphanumeric + underscore/dash) |
| `metadata.description` | string | ❌ | What the agent does |
| `spec.llms[].id` | string | ✅ | Unique LLM identifier |
| `spec.llms[].model` | string | ✅ | Model name (gemini-2.5-flash, gemini-2.5-pro, etc.) |
| `spec.llms[].temperature` | float | ❌ | 0.0-1.0, creativity level (default: 0.7) |
| `spec.llms[].max_tokens` | int | ❌ | Max output length (default: 2048) |
| `workflow.nodes[].id` | string | ✅ | Node identifier in graph |
| `workflow.nodes[].type` | string | ✅ | "start", "llm", or "end" |
| `workflow.nodes[].config.instructions` | string | ✅ | Prompt template with {variable} placeholders |
| `workflow.nodes[].config.system_prompt` | string | ❌ | System-level behavior instruction |
| `workflow.edges[].source` | string | ✅ | From node ID |
| `workflow.edges[].target` | string | ✅ | To node ID |

---

## Examples

### Example 1: Simple Q&A Agent

```yaml
version: "1.0"
kind: Agent

metadata:
  name: QuestionAnswerAgent
  description: Simple agent for answering questions

spec:
  llms:
    - id: llm-qa
      provider: vertexai
      model: gemini-2.5-flash
      temperature: 0.5
  tools: []
  memory:
    type: standard
    persistence: true

workflow:
  nodes:
    - id: start
      type: start
    
    - id: assistant
      type: llm
      config:
        llm_id: llm-qa
        instructions: "Answer this question: {question}"
        system_prompt: "You are an expert assistant."
      inputs:
        - name: question
          type: text
    
    - id: end
      type: end

  edges:
    - source: start
      target: assistant
    - source: assistant
      target: end
```

**Deploy:**
```bash
python main.py qa_agent.yaml QuestionAnswerer
```

**Test locally:**
```bash
python localtest.py qa_agent.yaml "What is machine learning?"
```

### Example 2: Multi-Step Analysis Agent

```yaml
version: "1.0"
kind: Agent

metadata:
  name: DataAnalysisAgent
  description: Multi-step data analysis workflow

spec:
  llms:
    - id: llm-research
      provider: vertexai
      model: gemini-2.5-flash
      
    - id: llm-analysis
      provider: vertexai
      model: gemini-2.5-pro
      temperature: 0.2

workflow:
  nodes:
    - id: start
      type: start
    
    - id: researcher
      type: llm
      config:
        llm_id: llm-research
        instructions: "Research: {topic}"
        system_prompt: "Provide comprehensive research."
      inputs:
        - name: topic
          type: text
    
    - id: analyzer
      type: llm
      config:
        llm_id: llm-analysis
        instructions: "Analyze research findings and provide insights."
        system_prompt: "Provide technical analysis."
    
    - id: end
      type: end

  edges:
    - source: start
      target: researcher
    - source: researcher
      target: analyzer
    - source: analyzer
      target: end
```

---

## Testing

### Unit Tests

```bash
# Run all tests
pytest tests/

# Run specific test file
pytest tests/test_graph_builder.py -v

# Run with coverage
pytest --cov=agent tests/
```

### Integration Test

```bash
# Full end-to-end test (local deployment)
python -m pytest tests/integration/test_local_deployment.py -v
```

### Manual Testing Checklist

- [ ] Configuration validation passes
- [ ] Local test succeeds: `python localtest.py`
- [ ] Cloud Build deployment succeeds
- [ ] Agent appears in `gcloud ai agents list`
- [ ] Query works: `gcloud ai agents query ...`
- [ ] Logs appear in Cloud Logging
- [ ] Cloud Trace shows execution spans

---

## Troubleshooting

### Configuration Issues

#### "GOOGLE_CLOUD_PROJECT is required"
```bash
# Check if set
echo $GOOGLE_CLOUD_PROJECT

# Set it
export GOOGLE_CLOUD_PROJECT=my-project-id
echo "GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT" >> agent/.env
```

#### "Cannot access staging bucket"
```bash
# Verify bucket exists
gsutil ls gs://my-bucket/

# Create if missing
gsutil mb -l us-central1 gs://my-project-adk2-staging

# Check permissions
gsutil acl ch -u $(gcloud config get-value account):O gs://my-bucket/
```

### Authentication Issues

#### "DefaultCredentialsError"
```bash
# Use Application Default Credentials
gcloud auth application-default login

# OR use service account
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
```

### Deployment Issues

#### "Invalid YAML schema"
```bash
# Validate YAML format
python -c "
import yaml
with open('my_agent.yaml') as f:
    data = yaml.safe_load(f)
    required = ['version', 'kind', 'metadata', 'spec', 'workflow']
    missing = [k for k in required if k not in data]
    print('Missing:', missing if missing else 'None')
"
```

#### "Deployment timeout"
```bash
# Check Cloud Build status
gcloud builds list --limit 10

# View build logs
gcloud builds log BUILD_ID
```

### Runtime Issues

#### Agent hangs
```bash
# Check session service
gcloud ai agents describe projects/PROJECT/locations/LOCATION/agents/AGENT_ID

# View traces
gcloud trace list
```

---

## Support

### Getting Help

1. **Check Troubleshooting**: See section above
2. **View Logs**: `gcloud logging read --limit=50`
3. **Check Traces**: `gcloud trace list`
4. **Review Docs**: https://cloud.google.com/vertex-ai/docs

### Reporting Issues

Include:
- [ ] Python version: `python --version`
- [ ] ADK version: `pip show google-adk`
- [ ] Error message and stack trace
- [ ] YAML file (sanitized)
- [ ] Command used
- [ ] GCP project ID

### Useful Commands

```bash
# List all agents
gcloud ai agents list --location=us-central1 --format=table

# Query agent
gcloud ai agents query RESOURCE_NAME --input="Your question"

# Delete agent
gcloud ai agents delete RESOURCE_NAME

# View deployment traces
gcloud trace list --filter="resource.type=cloud_run_revision"

# Check API status
gcloud services describe aiplatform.googleapis.com
```

---

## Status

**Current State**: Alpha (v0.1.0)
- ✅ YAML parsing and validation
- ✅ Local testing with in-memory sessions
- ✅ GCP Agent Engine deployment
- ✅ Cloud Tracing integration
- ⏳ Production hardening
- ⏳ Automated CI/CD pipelines

**Requirements**:
- ADK 2.0 (Alpha) - May have breaking changes
- Google Generative AI SDK 0.8.0+
- Vertex AI Agent Engine access (beta feature)

---

## License

Apache License 2.0 - See LICENSE file

## Contributing

Contributions welcome! See CONTRIBUTING.md for guidelines.

## References

- [Google ADK Documentation](https://github.com/googleapis/python-adk)
- [Vertex AI Agent Engine](https://cloud.google.com/vertex-ai/docs/agent-engine)
- [Google Generative AI API](https://cloud.google.com/vertex-ai/docs/generative-ai/overview)

---

**Last Updated**: May 7, 2026  
**Maintained By**: Google Cloud Professional Services