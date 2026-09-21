# ADK2 Graph Asset - Quick Start Guide

Deploy AI agents to Google Cloud Vertex AI Agent Engine using simple YAML configurations.

## 🚀 Quick Start (5 minutes)

### 1. **Prerequisites Check**
```bash
./validate-setup.sh
```
This checks if you have:
- Google Cloud SDK (`gcloud`, `gsutil`)
- Python 3.10+
- GCP project configured
- Required APIs enabled

### 2. **Interactive Setup**
```bash
./quickstart.sh
```
This guide walks you through:
- ✅ Authenticating with Google Cloud
- ✅ Configuring your GCP project
- ✅ Setting up Python environment
- ✅ Creating staging bucket
- ✅ Running local test
- ✅ Deploying to Agent Engine (optional)

### 3. **Deploy Your Agent**
```bash
python main_enhanced.py agent/sample_graph.yaml MyAgentName
```

---

## 📋 Usage Guides

### Option A: **Interactive Setup (Recommended for first-time users)**

```bash
# Everything automated and interactive
./quickstart.sh
```

**What it does:**
- Validates all prerequisites
- Authenticates with Google Cloud
- Creates/verifies staging bucket
- Sets up Python environment
- Tests configuration locally
- Deploys agent (optional)

---

### Option B: **Manual Deployment Script**

```bash
# Full control over deployment
./deployment-agent.sh -p your-project-id

# With custom options
./deployment-agent.sh \
  -p your-project-id \
  -r us-central1 \
  -b my-staging-bucket \
  -y my_agent.yaml \
  -n "My Agent Name"
```

**Options:**
```
-p, --project PROJECT_ID      GCP Project ID (required)
-r, --region REGION           Vertex AI region (default: us-central1)
-b, --bucket BUCKET_NAME      GCS bucket name (default: PROJECT_ID-adk2-staging)
-y, --yaml YAML_FILE          YAML graph definition (default: agent/sample_graph.yaml)
-n, --name AGENT_NAME         Display name for agent
-s, --skip-checks             Skip GCP prerequisite checks
-h, --help                    Show help
```

---

### Option C: **Direct Python Deployment**

```bash
# Requires environment variables configured
export GOOGLE_CLOUD_PROJECT=my-project-id
export STAGING_BUCKET=gs://my-project-adk2-staging
export GOOGLE_CLOUD_LOCATION=us-central1

python main_enhanced.py agent/sample_graph.yaml MyAgentName
```

---

### Option D: **Google Cloud Build (CI/CD)**

```bash
# Automated deployment via Google Cloud Build
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_LOCATION=us-central1,_AGENT_DISPLAY_NAME=MyAgent
```

---

## 🔧 Configuration

### Configuration File: `agent/.env`

Create from template:
```bash
cp agent/.env.example agent/.env
```

Edit with your values:
```env
GOOGLE_CLOUD_PROJECT=your-project-id
STAGING_BUCKET=gs://your-project-adk2-staging
GOOGLE_CLOUD_LOCATION=us-central1
```

**Required:**
- `GOOGLE_CLOUD_PROJECT` - Your GCP Project ID
- `STAGING_BUCKET` - GCS bucket for agent code staging

**Optional:**
- `GOOGLE_CLOUD_LOCATION` - Vertex AI region (default: us-central1)
- `GOOGLE_APPLICATION_CREDENTIALS` - Service account key path

---

## 📝 Creating Your First Agent

### 1. **Copy Sample**
```bash
cp agent/sample_graph.yaml my_agent.yaml
```

### 2. **Edit Configuration**
```yaml
version: "1.0"
kind: Agent

metadata:
  name: MyCustomAgent
  description: My first ADK2 graph agent

spec:
  llms:
    - id: llm-main
      provider: vertexai
      model: gemini-2.5-flash  # or gemini-2.0-pro, etc.
      temperature: 0.7
      max_tokens: 2048
  
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
        llm_id: llm-main
        instructions: "Process this request: {request}"
        system_prompt: "You are a helpful assistant."
      inputs:
        - name: request
          type: text
  
  edges:
    - source: start
      target: assistant
```

### 3. **Test Locally**
```bash
source venv/bin/activate
python localtest.py my_agent.yaml "What is cloud computing?"
```

### 4. **Deploy**
```bash
python main_enhanced.py my_agent.yaml MyCustomAgent
```

---

## 📊 Deployment Files Explained

| File | Purpose | When to Use |
|------|---------|-----------|
| `quickstart.sh` | Interactive guided setup | First-time setup |
| `deployment-agent.sh` | Automated deployment script | Production deployments |
| `validate-setup.sh` | Environment checker | Troubleshooting |
| `cloudbuild.yaml` | Google Cloud Build config | CI/CD pipelines |
| `main_enhanced.py` | Enhanced deployment tool | Direct Python deployment |
| `main.py` | Original deployment tool | Keep for compatibility |

---

## 🧪 Testing

### Local Test
```bash
source venv/bin/activate
python localtest.py agent/sample_graph.yaml
```

### Validate Configuration
```bash
./validate-setup.sh
```

### Check Deployment
```bash
gcloud aiplatform agents list --location=us-central1
```

---

## 📋 Troubleshooting

### "GOOGLE_CLOUD_PROJECT is required"
```bash
# Fix: Set environment variable
export GOOGLE_CLOUD_PROJECT=your-project-id
# Or in .env file:
echo "GOOGLE_CLOUD_PROJECT=your-project-id" >> agent/.env
```

### "Staging bucket not found"
```bash
# Create bucket
gsutil mb -p your-project-id -l us-central1 gs://your-project-adk2-staging
```

### "Permission denied" errors
```bash
# Grant required IAM roles
gcloud projects add-iam-policy-binding your-project-id \
  --member=user:your-email@example.com \
  --role=roles/aiplatform.admin

gcloud projects add-iam-policy-binding your-project-id \
  --member=user:your-email@example.com \
  --role=roles/storage.objectAdmin
```

### "Not authenticated with GCP"
```bash
# Authenticate
gcloud auth application-default login
```

### Local test hangs or times out
- Check your internet connection
- Verify Vertex AI API is enabled:
  ```bash
  gcloud services enable aiplatform.googleapis.com
  ```

---

## 🔐 Security Best Practices

1. **Never commit secrets**
   - `.env` file is in `.gitignore`
   - Never add `GOOGLE_APPLICATION_CREDENTIALS` or service account keys

2. **Use Application Default Credentials (ADC)**
   ```bash
   gcloud auth application-default login
   ```

3. **Use service account for production**
   ```bash
   # Create service account
   gcloud iam service-accounts create adk2-deploy-sa
   
   # Grant roles
   gcloud projects add-iam-policy-binding your-project-id \
     --member=serviceAccount:adk2-deploy-sa@your-project-id.iam.gserviceaccount.com \
     --role=roles/aiplatform.admin
   
   # Create and download key (store securely)
   gcloud iam service-accounts keys create key.json \
     --iam-account=adk2-deploy-sa@your-project-id.iam.gserviceaccount.com
   ```

4. **Protect bucket contents**
   ```bash
   # Make staging bucket private
   gsutil iam ch serviceAccount:adk2-deploy-sa@your-project-id.iam.gserviceaccount.com:objectAdmin gs://your-bucket
   ```

---

## 📚 Project Structure

```
adk2graph_asset/
├── agent/
│   ├── .env                    # Configuration (gitignored)
│   ├── .env.example            # Configuration template
│   ├── adk_agent.py            # Agent implementation
│   ├── gcp_config.py           # GCP setup
│   ├── graph_builder.py        # YAML to ADK2 converter
│   ├── requirements.txt        # Python dependencies
│   └── sample_graph.yaml       # Example agent
├── quickstart.sh               # Interactive setup
├── deployment-agent.sh         # Deployment script
├── validate-setup.sh           # Environment check
├── cloudbuild.yaml             # Cloud Build config
├── main_enhanced.py            # Enhanced deployment tool
├── main.py                     # Original deployment tool
├── localtest.py                # Local testing
└── README.md                   # This file
```

---

## 🎯 Typical Workflows

### Scenario 1: First Time Deployment
```bash
# 1. Validate environment
./validate-setup.sh

# 2. Interactive setup
./quickstart.sh

# 3. Done! Your agent is deployed
```

### Scenario 2: Create Production Agent
```bash
# 1. Copy and customize YAML
cp agent/sample_graph.yaml prod_agent.yaml
# ... edit prod_agent.yaml ...

# 2. Test locally
python localtest.py prod_agent.yaml

# 3. Deploy
./deployment-agent.sh -p my-project -y prod_agent.yaml -n "Production Agent"
```

### Scenario 3: CI/CD Pipeline
```bash
# Push code to repo with:
# - cloudbuild.yaml
# - agent/ directory
# - main_enhanced.py

# Trigger build
git push

# Google Cloud Build automatically:
# - Runs tests
# - Validates YAML
# - Deploys agent
# - Checks results
```

### Scenario 4: Multiple Regions
```bash
# Deploy to US
./deployment-agent.sh -p my-project -r us-central1 -y my_agent.yaml

# Deploy to Europe
./deployment-agent.sh -p my-project -r europe-west1 -y my_agent.yaml

# Deploy to Asia
./deployment-agent.sh -p my-project -r asia-east1 -y my_agent.yaml
```

---

## 🔗 Next Steps

1. **Learn More**
   - [Vertex AI Agents Documentation](https://cloud.google.com/vertex-ai/docs/agents)
   - [ADK 2.0 Guide](https://github.com/googleapis/google-adk)
   - [OpenAPI Schema Format](https://spec.openapis.org/oas/v3.0.3)

2. **Explore Examples**
   - Check `agent/sample_graph.yaml` for basic workflow
   - Extend with multiple LLM nodes
   - Add tool integration

3. **Monitor Deployment**
   - View logs: `gcloud logging read`
   - Check Agent Engine: `gcloud aiplatform agents list`
   - Monitor costs: Google Cloud Console

---

## ❓ FAQ

**Q: How much does this cost?**
A: Vertex AI pricing depends on your usage. Check [pricing](https://cloud.google.com/vertex-ai/pricing) for details.

**Q: Can I use different LLM models?**
A: Yes! Edit `spec.llms[].model` in YAML. Supported: gemini-2.5-flash, gemini-2.0-pro, etc.

**Q: How do I enable conversation history?**
A: It's automatic with `memory.persistence: true` in YAML.

**Q: Can I deploy to multiple regions?**
A: Yes! Run deployment script for each region separately.

**Q: How do I update a deployed agent?**
A: Redeploy with new YAML - Agent Engine creates a new revision.

---

## 📞 Support

- **Validation issues?** Run: `./validate-setup.sh`
- **Configuration problems?** Check: `agent/.env.example`
- **Deployment errors?** View logs: `gcloud logging read --limit 50`
- **ADK questions?** See: [ADK Documentation](https://github.com/googleapis/google-adk)

---

## 📄 License

This tool is part of Google Cloud Professional Services tools collection.

---

**Happy deploying! 🚀**
