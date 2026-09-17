#!/bin/bash

################################################################################
# ADK2 Graph Asset - Environment Validation
#
# This script validates that your environment is properly configured for
# deploying ADK2 graph agents to Google Cloud Vertex AI.
#
# Usage:
#   ./validate-setup.sh
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

ISSUES=0
WARNINGS=0

# Helper functions
print_header() {
    echo ""
    echo -e "${BOLD}${BLUE}$1${NC}"
    echo -e "${BOLD}${BLUE}$(printf '%.0s─' $(seq 1 ${#1}))${NC}"
}

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ISSUES++))
}

# Start
clear
cat << "EOF"

  ╔═══════════════════════════════════════════════════════════════════╗
  ║                                                                   ║
  ║     ADK2 Graph Asset - Environment Validation                    ║
  ║                                                                   ║
  ╚═══════════════════════════════════════════════════════════════════╝

EOF

print_header "1. System Dependencies"

# Check gcloud
if command -v gcloud &> /dev/null; then
    GCLOUD_VERSION=$(gcloud --version 2>&1 | head -n 1)
    check_pass "$GCLOUD_VERSION"
else
    check_fail "gcloud CLI not found (https://cloud.google.com/sdk/install)"
fi

# Check gsutil
if command -v gsutil &> /dev/null; then
    check_pass "gsutil is installed"
else
    check_fail "gsutil not found (included with gcloud SDK)"
fi

# Check Python
if command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version 2>&1)
    if python -c "import sys; exit(0 if sys.version_info >= (3, 10) else 1)" 2>/dev/null; then
        check_pass "$PYTHON_VERSION (required: 3.10+)"
    else
        check_fail "$PYTHON_VERSION found, but 3.10+ required"
    fi
else
    check_fail "python not found (https://www.python.org/downloads/)"
fi

print_header "2. GCP Authentication"

# Check authentication
if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
    check_pass "Authenticated as: $ACCOUNT"
else
    check_fail "Not authenticated with GCP"
    echo "     Run: gcloud auth application-default login"
fi

# Check current project
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -n "$CURRENT_PROJECT" ]; then
    check_pass "GCP Project configured: $CURRENT_PROJECT"
else
    check_warn "No GCP project configured"
    echo "     Run: gcloud config set project YOUR_PROJECT_ID"
fi

print_header "3. GCP APIs & Services"

if [ -n "$CURRENT_PROJECT" ]; then
    
    # Check Vertex AI API
    if gcloud services list --enabled --filter=name:aiplatform.googleapis.com | grep -q aiplatform; then
        check_pass "Vertex AI API is enabled"
    else
        check_warn "Vertex AI API not enabled"
        echo "     Run: gcloud services enable aiplatform.googleapis.com"
    fi
    
    # Check Cloud Resource Manager API
    if gcloud services list --enabled --filter=name:cloudresourcemanager.googleapis.com | grep -q cloudresourcemanager; then
        check_pass "Cloud Resource Manager API is enabled"
    else
        check_warn "Cloud Resource Manager API not enabled"
        echo "     Run: gcloud services enable cloudresourcemanager.googleapis.com"
    fi
    
    # Check Storage API
    if gcloud services list --enabled --filter=name:storage.googleapis.com | grep -q storage; then
        check_pass "Storage API is enabled"
    else
        check_warn "Storage API not enabled"
        echo "     Run: gcloud services enable storage.googleapis.com"
    fi
else
    check_warn "Cannot check APIs without a GCP project"
fi

print_header "4. Python Dependencies"

# Check virtual environment
if [ -d "venv" ]; then
    check_pass "Virtual environment exists: venv/"
    
    # Check if activated
    if [ -z "${VIRTUAL_ENV:-}" ]; then
        check_warn "Virtual environment not activated"
        echo "     Run: source venv/bin/activate"
    else
        check_pass "Virtual environment is active"
    fi
else
    check_warn "Virtual environment not found: venv/"
    echo "     Create with: python -m venv venv"
fi

# Check requirements file
if [ -f "agent/requirements.txt" ]; then
    check_pass "requirements.txt found"
    
    # Try to check if packages are installed
    if [ -n "${VIRTUAL_ENV:-}" ]; then
        MISSING_PACKAGES=0
        while IFS= read -r line || [ -n "$line" ]; do
            # Skip comments and empty lines
            [[ $line =~ ^# ]] && continue
            [[ -z "$line" ]] && continue
            
            # Extract package name (before ==, >=, etc.)
            PKG_NAME=$(echo "$line" | sed 's/[><=].*//' | sed 's/\[.*//')
            
            if python -c "import pkg_resources; pkg_resources.require('$PKG_NAME')" 2>/dev/null; then
                :
            else
                ((MISSING_PACKAGES++))
            fi
        done < "agent/requirements.txt"
        
        if [ $MISSING_PACKAGES -eq 0 ]; then
            check_pass "All required packages are installed"
        else
            check_warn "$MISSING_PACKAGES required packages not installed"
            echo "     Run: pip install -r agent/requirements.txt"
        fi
    else
        check_warn "Cannot check packages without active virtual environment"
    fi
else
    check_fail "requirements.txt not found"
fi

print_header "5. Configuration Files"

# Check .env file
if [ -f "agent/.env" ]; then
    check_pass "Configuration file exists: agent/.env"
    
    # Check required variables
    if grep -q "GOOGLE_CLOUD_PROJECT" agent/.env && grep -q "STAGING_BUCKET" agent/.env; then
        check_pass "Required environment variables configured"
    else
        check_warn "Missing required environment variables in .env"
        echo "     See agent/.env.example for template"
    fi
else
    check_warn "Configuration file not found: agent/.env"
    echo "     Create from template: cp agent/.env.example agent/.env"
fi

# Check .env.example
if [ -f "agent/.env.example" ]; then
    check_pass "Configuration template exists: agent/.env.example"
else
    check_warn "Configuration template not found: agent/.env.example"
fi

# Check YAML file
if [ -f "agent/sample_graph.yaml" ]; then
    check_pass "Sample YAML file exists: agent/sample_graph.yaml"
else
    check_fail "Sample YAML file not found: agent/sample_graph.yaml"
fi

print_header "6. GCS Staging Bucket"

if [ -n "$CURRENT_PROJECT" ]; then
    BUCKET_NAME="${CURRENT_PROJECT}-adk2-staging"
    
    if gsutil -h -m ls -b "gs://${BUCKET_NAME}" > /dev/null 2>&1; then
        check_pass "Staging bucket exists: gs://${BUCKET_NAME}"
    else
        check_warn "Staging bucket not found: gs://${BUCKET_NAME}"
        echo "     Create with: gsutil mb -p $CURRENT_PROJECT -l us-central1 gs://${BUCKET_NAME}"
    fi
else
    check_warn "Cannot check staging bucket without GCP project"
fi

print_header "7. Deployment Scripts"

for script in deployment-agent.sh quickstart.sh validate-setup.sh; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            check_pass "$script is executable"
        else
            check_warn "$script exists but is not executable"
            echo "     Make executable: chmod +x $script"
        fi
    else
        check_warn "$script not found"
    fi
done

print_header "8. Core Files"

for file in main_enhanced.py agent/adk_agent.py agent/graph_builder.py agent/gcp_config.py; do
    if [ -f "$file" ]; then
        check_pass "$file exists"
    else
        check_fail "$file not found"
    fi
done

# Summary
echo ""
print_header "Summary"

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}${BOLD}✓ All checks passed! Your environment is ready.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Test locally: python localtest.py"
    echo "  2. Deploy: python main_enhanced.py agent/sample_graph.yaml"
    echo ""
    exit 0
elif [ $ISSUES -eq 0 ]; then
    echo -e "${YELLOW}${BOLD}⚠ $WARNINGS warning(s) found.${NC}"
    echo ""
    echo "Your environment is mostly ready, but some features may not work."
    echo "Address the warnings above for full functionality."
    echo ""
    exit 0
else
    echo -e "${RED}${BOLD}✗ $ISSUES error(s) found.${NC}"
    echo ""
    echo "Your environment is not ready for deployment."
    echo "Please fix the errors above and run this script again."
    echo ""
    exit 1
fi
