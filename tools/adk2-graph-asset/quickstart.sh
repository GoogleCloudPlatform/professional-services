#!/bin/bash

################################################################################
# ADK2 Graph Asset - Quick Start
# 
# Interactive guided setup and deployment script
#
# Usage:
#   ./quickstart.sh
#
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

clear

# Display banner
cat << "EOF"

  ╔═══════════════════════════════════════════════════════════════════════════╗
  ║                                                                           ║
  ║               ADK2 Graph Asset - Google Cloud Deployment                 ║
  ║                                                                           ║
  ║     Deploy AI agents to Google Cloud Vertex AI Agent Engine in minutes   ║
  ║                                                                           ║
  ╚═══════════════════════════════════════════════════════════════════════════╝

EOF

echo ""
echo "This script will guide you through:"
echo "  1. Checking prerequisites"
echo "  2. Authenticating with Google Cloud"
echo "  3. Configuring your project"
echo "  4. Deploying your agent"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# Function to print colored output
print_step() {
    echo ""
    echo -e "${BLUE}${BOLD}→ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Step 1: Check prerequisites
print_step "Checking prerequisites..."

MISSING_DEPS=0

for cmd in gcloud gsutil python; do
    if command -v "$cmd" &> /dev/null; then
        print_success "$cmd is installed"
    else
        print_error "$cmd is not installed"
        MISSING_DEPS=1
    fi
done

if [ $MISSING_DEPS -eq 1 ]; then
    echo ""
    echo "Please install missing tools:"
    echo "  macOS:  brew install gcloud-sdk"
    echo "  Linux:  curl https://sdk.cloud.google.com | bash"
    exit 1
fi

# Step 2: Check Python version
print_step "Verifying Python version..."

if python -c "import sys; exit(0 if sys.version_info >= (3, 10) else 1)" 2>/dev/null; then
    PYTHON_VER=$(python --version 2>&1 | awk '{print $2}')
    print_success "Python $PYTHON_VER (required: 3.10+)"
else
    print_error "Python 3.10+ required"
    exit 1
fi

# Step 3: Check GCP authentication
print_step "Checking GCP authentication..."

if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
    print_success "Authenticated as: $ACCOUNT"
else
    print_warning "Not authenticated with GCP"
    echo ""
    read -p "Authenticate now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gcloud auth application-default login
        print_success "Authentication successful"
    else
        print_error "Authentication required to continue"
        exit 1
    fi
fi

# Step 4: Get project ID
print_step "Configuring Google Cloud project..."

DEFAULT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")

if [ -n "$DEFAULT_PROJECT" ]; then
    echo "Current project: $DEFAULT_PROJECT"
    read -p "Use this project? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        DEFAULT_PROJECT=""
    fi
fi

if [ -z "$DEFAULT_PROJECT" ]; then
    echo ""
    echo "Projects in your account:"
    gcloud projects list --format="table(project_id)" | head -10
    echo ""
    read -p "Enter your GCP Project ID: " PROJECT_ID
else
    PROJECT_ID="$DEFAULT_PROJECT"
fi

if [ -z "$PROJECT_ID" ]; then
    print_error "Project ID is required"
    exit 1
fi

gcloud config set project "$PROJECT_ID" 2>/dev/null
print_success "Project set to: $PROJECT_ID"

# Step 5: Get region
print_step "Selecting region..."

echo ""
echo "Available regions (top 5):"
echo "  1. us-central1 (default)"
echo "  2. us-east1"
echo "  3. us-west1"
echo "  4. europe-west1"
echo "  5. asia-east1"
echo ""
read -p "Enter region or press Enter for us-central1: " REGION
REGION=${REGION:-us-central1}
print_success "Region: $REGION"

# Step 6: Create staging bucket
print_step "Setting up staging bucket..."

BUCKET_NAME="${PROJECT_ID}-adk2-staging"

if gsutil -h -m ls -b "gs://${BUCKET_NAME}" > /dev/null 2>&1; then
    print_success "Staging bucket exists: gs://${BUCKET_NAME}"
else
    echo "Creating bucket gs://${BUCKET_NAME}..."
    gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://${BUCKET_NAME}"
    print_success "Staging bucket created"
fi

# Step 7: Setup Python environment
print_step "Setting up Python environment..."

if [ ! -d "venv" ]; then
    python -m venv venv
    print_success "Virtual environment created"
fi

source venv/bin/activate
print_success "Virtual environment activated"

echo "Installing dependencies..."
python -m pip install --upgrade pip > /dev/null 2>&1
pip install -q -r agent/requirements.txt
print_success "Dependencies installed"

# Step 8: Create .env file
print_step "Creating configuration file..."

cat > agent/.env << EOF
# Auto-generated by quickstart.sh on $(date)
GOOGLE_CLOUD_PROJECT=$PROJECT_ID
GOOGLE_CLOUD_LOCATION=$REGION
STAGING_BUCKET=gs://${BUCKET_NAME}
GOOGLE_GENAI_USE_VERTEXAI=1
GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true
OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true
EOF

print_success "Configuration saved to agent/.env"

# Step 9: Verify with local test
print_step "Verifying setup with local test..."

echo ""
echo "Running local test (this may take a minute)..."
python localtest.py agent/sample_graph.yaml "Tell me a joke about cloud computing" || {
    print_warning "Local test had issues, but setup is complete"
}

# Step 10: Ask about deployment
print_step "Ready to deploy to Google Cloud Agent Engine"

echo ""
read -p "Deploy now? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    python main_enhanced.py agent/sample_graph.yaml ADK2GraphAgentQuickStart || {
        print_error "Deployment failed"
        exit 1
    }
else
    echo ""
    echo "Deployment skipped. To deploy later, run:"
    echo ""
    echo "  source venv/bin/activate"
    echo "  python main_enhanced.py agent/sample_graph.yaml MyAgentName"
    echo ""
fi

# Final summary
cat << EOF

${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
${GREEN}✓ Setup Complete!${NC}
${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}

Your configuration:
  Project ID:      $PROJECT_ID
  Region:          $REGION
  Staging Bucket:  gs://${BUCKET_NAME}

Next steps:

1. Test your first agent locally:
   source venv/bin/activate
   python localtest.py agent/sample_graph.yaml

2. Deploy to Google Cloud:
   source venv/bin/activate
   python main_enhanced.py agent/sample_graph.yaml MyAgentName

3. Create your own agent:
   - Copy agent/sample_graph.yaml to my_agent.yaml
   - Edit my_agent.yaml with your configuration
   - Deploy: python main_enhanced.py my_agent.yaml

4. Or use the automated deployment script:
   ./deployment-agent.sh -p $PROJECT_ID -y agent/sample_graph.yaml

Documentation:
  - Getting started: See README.md
  - Deployment guide: ./deployment-agent.sh -h
  - Troubleshooting: Check logs with gcloud logging read

${GREEN}Happy deploying!${NC}

EOF

print_success "Quickstart completed successfully"
