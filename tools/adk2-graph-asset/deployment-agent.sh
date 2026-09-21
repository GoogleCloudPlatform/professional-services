#!/bin/bash

################################################################################
# ADK2 Graph Asset - Deployment Script
# 
# This script handles all prerequisites, configuration, and deployment steps
# for the ADK2 Graph Asset tool to Google Cloud Vertex AI Agent Engine.
#
# Usage:
#   ./deployment-agent.sh [options]
#
# Options:
#   -p, --project PROJECT_ID         GCP Project ID (required)
#   -r, --region REGION              Vertex AI region (default: us-central1)
#   -b, --bucket BUCKET_NAME         GCS bucket name (default: PROJECT_ID-adk2-staging)
#   -y, --yaml YAML_FILE             YAML graph definition (default: agent/sample_graph.yaml)
#   -n, --name AGENT_NAME            Display name for agent (default: from YAML)
#   -s, --skip-checks                Skip GCP prerequisite checks
#   -h, --help                       Show this help message
#
# Examples:
#   ./deployment-agent.sh -p my-project-123
#   ./deployment-agent.sh -p my-project-123 -r europe-west1 -y my_agent.yaml
#
################################################################################

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
REGION="us-central1"
BUCKET_NAME=""
YAML_FILE="agent/sample_graph.yaml"
AGENT_NAME=""
SKIP_CHECKS=false
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Functions
print_header() {
    echo -e "${BLUE}================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_step() {
    echo -e "${BLUE}→${NC} $1"
}

show_help() {
    head -n 23 "$0" | tail -n 22
    exit 0
}

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project)
            PROJECT_ID="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -b|--bucket)
            BUCKET_NAME="$2"
            shift 2
            ;;
        -y|--yaml)
            YAML_FILE="$2"
            shift 2
            ;;
        -n|--name)
            AGENT_NAME="$2"
            shift 2
            ;;
        -s|--skip-checks)
            SKIP_CHECKS=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            ;;
    esac
done

# Validate required arguments
if [ -z "$PROJECT_ID" ]; then
    print_error "Project ID is required"
    echo "Use: ./deployment-agent.sh -p YOUR_PROJECT_ID"
    exit 1
fi

# Set default bucket name
if [ -z "$BUCKET_NAME" ]; then
    BUCKET_NAME="${PROJECT_ID}-adk2-staging"
fi

print_header "ADK2 Graph Asset Deployment"
echo ""
echo "Configuration:"
echo "  Project ID:    $PROJECT_ID"
echo "  Region:        $REGION"
echo "  Bucket:        $BUCKET_NAME"
echo "  YAML File:     $YAML_FILE"
echo "  Agent Name:    ${AGENT_NAME:-(from YAML metadata.name)}"
echo ""

# Step 1: Verify prerequisites
print_header "Step 1: Verifying Prerequisites"

check_command() {
    if ! command -v "$1" &> /dev/null; then
        print_error "$1 is not installed"
        echo "   Install with: brew install $1 (macOS) or apt-get install $1 (Linux)"
        return 1
    fi
    print_success "$1 is installed"
}

check_command "gcloud"
check_command "gsutil"
check_command "python"

# Check Python version
PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
REQUIRED_VERSION="3.10"
if python -c "import sys; exit(0 if sys.version_info >= (3, 10) else 1)" 2>/dev/null; then
    print_success "Python version $PYTHON_VERSION (required: 3.10+)"
else
    print_error "Python 3.10+ required, found $PYTHON_VERSION"
    exit 1
fi

# Step 2: Verify GCP authentication
print_header "Step 2: Verifying GCP Authentication"

if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
    print_success "Authenticated as: $ACCOUNT"
else
    print_error "Not authenticated with GCP"
    echo "   Run: gcloud auth application-default login"
    exit 1
fi

# Step 3: Set GCP project
print_header "Step 3: Setting GCP Project"

gcloud config set project "$PROJECT_ID" 2>/dev/null
CURRENT_PROJECT=$(gcloud config get-value project)

if [ "$CURRENT_PROJECT" = "$PROJECT_ID" ]; then
    print_success "Project set to: $PROJECT_ID"
else
    print_error "Failed to set project"
    exit 1
fi

# Step 4: Check GCP prerequisites (optional)
if [ "$SKIP_CHECKS" = false ]; then
    print_header "Step 4: Checking GCP Prerequisites"
    
    print_step "Checking Vertex AI API..."
    if gcloud services list --enabled --filter=name:aiplatform.googleapis.com | grep -q aiplatform; then
        print_success "Vertex AI API is enabled"
    else
        print_warning "Enabling Vertex AI API..."
        gcloud services enable aiplatform.googleapis.com
        print_success "Vertex AI API enabled"
    fi
    
    print_step "Checking Cloud Resource Manager API..."
    if gcloud services list --enabled --filter=name:cloudresourcemanager.googleapis.com | grep -q cloudresourcemanager; then
        print_success "Cloud Resource Manager API is enabled"
    else
        gcloud services enable cloudresourcemanager.googleapis.com
        print_success "Cloud Resource Manager API enabled"
    fi
    
    print_step "Checking Storage API..."
    if gcloud services list --enabled --filter=name:storage.googleapis.com | grep -q storage; then
        print_success "Storage API is enabled"
    else
        gcloud services enable storage.googleapis.com
        print_success "Storage API enabled"
    fi
else
    print_step "Skipping GCP prerequisite checks"
fi

# Step 5: Create staging bucket
print_header "Step 5: Creating/Verifying Staging Bucket"

if gsutil -h -m ls -b "gs://${BUCKET_NAME}" > /dev/null 2>&1; then
    print_success "Staging bucket already exists: gs://${BUCKET_NAME}"
else
    print_step "Creating staging bucket: gs://${BUCKET_NAME}"
    gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://${BUCKET_NAME}"
    print_success "Staging bucket created"
fi

# Step 6: Setup Python environment
print_header "Step 6: Setting Up Python Environment"

print_step "Creating virtual environment..."
if [ ! -d "venv" ]; then
    python -m venv venv
    print_success "Virtual environment created"
else
    print_success "Virtual environment already exists"
fi

print_step "Activating virtual environment..."
source venv/bin/activate

print_step "Installing dependencies..."
python -m pip install --upgrade pip > /dev/null 2>&1
pip install -q -r agent/requirements.txt
print_success "Dependencies installed"

# Step 7: Validate YAML configuration
print_header "Step 7: Validating YAML Configuration"

if [ ! -f "$YAML_FILE" ]; then
    print_error "YAML file not found: $YAML_FILE"
    exit 1
fi

print_step "Parsing YAML schema..."
python -c "
import yaml
import sys

required_keys = ['version', 'kind', 'metadata', 'spec', 'workflow']

try:
    with open('$YAML_FILE') as f:
        data = yaml.safe_load(f)
    
    missing = [k for k in required_keys if k not in data]
    if missing:
        print(f'ERROR: Missing required keys: {missing}')
        sys.exit(1)
    
    print('Schema: Valid')
    print(f'Agent Name: {data[\"metadata\"][\"name\"]}')
    print(f'Description: {data[\"metadata\"].get(\"description\", \"(none)\")}')
    
except Exception as e:
    print(f'ERROR: {e}')
    sys.exit(1)
" || exit 1

print_success "YAML validation passed"

# Step 8: Create .env configuration
print_header "Step 8: Configuring Environment"

ENV_FILE="agent/.env"
print_step "Creating ${ENV_FILE}..."

cat > "$ENV_FILE" << EOF
# Auto-generated by deployment-agent.sh
GOOGLE_CLOUD_PROJECT=$PROJECT_ID
GOOGLE_CLOUD_LOCATION=$REGION
STAGING_BUCKET=gs://${BUCKET_NAME}
GOOGLE_GENAI_USE_VERTEXAI=1
GOOGLE_CLOUD_AGENT_ENGINE_ENABLE_TELEMETRY=true
OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true
EOF

print_success "Environment configured in ${ENV_FILE}"

# Step 9: Deploy agent
print_header "Step 9: Deploying ADK2 Graph Agent"

DEPLOY_NAME="${AGENT_NAME:-}"
if [ -z "$DEPLOY_NAME" ]; then
    DEPLOY_NAME=$(python -c "import yaml; data = yaml.safe_load(open('$YAML_FILE')); print(data['metadata']['name'])")
fi

echo "Deploying agent: $DEPLOY_NAME"
echo ""

python main.py "$YAML_FILE" "$DEPLOY_NAME" || {
    print_error "Deployment failed"
    exit 1
}

# Step 10: Success summary
print_header "✓ Deployment Complete"

echo ""
echo "Next steps:"
echo ""
echo "1. Test the deployed agent:"
echo "   python localtest.py $YAML_FILE"
echo ""
echo "2. View deployment logs:"
echo "   gcloud logging read 'resource.type=cloud_run_revision' --limit 50"
echo ""
echo "3. List deployed agents:"
echo "   gcloud aiplatform agents list --location=$REGION"
echo ""
echo "Documentation:"
echo "  - Setup guide: See SETUP.md"
echo "  - Deployment guide: See DEPLOYMENT.md"
echo "  - Troubleshooting: See TROUBLESHOOTING.md"
echo ""

print_success "Deployment script completed successfully!"
