#!/bin/bash
# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


# ==============================================================================
# Creative Studio Infrastructure Bootstrap Script (Resumable)
#
# This interactive script guides a user through the entire process of setting
# up the Creative Studio infrastructure in a new or existing Google Cloud project.
# It saves progress and can be safely restarted if it fails.
# ==============================================================================

set -e

# --- Configuration ---
REQUIRED_TERRAFORM_VERSION="1.14.1"
UPSTREAM_REPO_URL="https://github.com/GoogleCloudPlatform/professional-services"
TEMPLATE_ENV_DIR="environments/dev-infra-example"
DEFAULT_ENV_NAME="dev-infra"
DEFAULT_BRANCH_NAME="pg-infra"
GCS_BUCKET_SUFFIX_FORMAT="cstudio-%s-tfstate"
GCS_BUCKET_PREFIX_FORMAT="infra/%s/state"
BE_SERVICE_NAME="cstudio-be"
FE_SERVICE_NAME="cstudio-fe"

# script will automatically set these
AUTO_FIREBASE_API_KEY=""           # Your Firebase Web API Key
AUTO_FIREBASE_AUTH_DOMAIN=""       # Your Firebase Auth Domain (e.g., project-id.firebaseapp.com)
AUTO_FIREBASE_PROJECT_ID=""        # Your Firebase Project ID
AUTO_FIREBASE_STORAGE_BUCKET=""    # Your Firebase Storage Bucket (e.g., project-id.appspot.com)
AUTO_FIREBASE_MESSAGING_SENDER_ID="" # Your Firebase Cloud Messaging Sender ID
AUTO_FIREBASE_APP_ID=""            # Your Firebase Web App ID
AUTO_FIREBASE_MEASUREMENT_ID=""    # Your Google Analytics Measurement ID
AUTO_OAUTH_CLIENT_ID=""

STATE_FILE=""
REPO_ROOT=""

# --- Color Definitions (High Contrast) ---
C_RESET='\033[0m'
C_RED='\033[1;31m'     # Bold/Bright Red for errors
C_GREEN='\033[1;32m'   # Bold/Bright Green for success
C_YELLOW='\033[1;33m'  # Bold/Bright Yellow for warnings and URLs
C_BLUE='\033[1;34m'    # Bold/Bright Blue for steps and prompts
C_CYAN='\033[1;36m'    # Bold/Bright Cyan for general info

# --- Helper Functions ---
info() { echo -e "${C_CYAN}➡️  $1${C_RESET}"; }
prompt() { echo -e "${C_BLUE}🤔  $1${C_RESET}"; }
warn() { echo -e "${C_YELLOW}⚠️  $1${C_RESET}"; }
fail() { echo -e "${C_RED}❌  $1${C_RESET}" >&2; exit 1; }
success() { echo -e "${C_GREEN}✅  $1${C_RESET}"; }
step() { echo -e "\n${C_BLUE}--- Step $1: $2 ---${C_RESET}"; }

# A reusable function to prompt for a value and update the .tfvars file
prompt_and_update_tfvar() {
    local prompt_text=$1
    local default_value=$2
    local tfvar_name=$3
    local var_to_set_ref=$4

    read -p "   $prompt_text [default value: $default_value]: " user_input < /dev/tty
    local final_value=${user_input:-$default_value}

	sed -i.bak "s|^[#[:space:]]*${tfvar_name}[[:space:]]*=.*|${tfvar_name} = \"${final_value}\"|g" "$TFVARS_FILE_PATH"

    # Set the variable in the script's global scope
    eval "$var_to_set_ref='$final_value'"
}

# --- State Management ---
write_state() {
    if [ -z "$STATE_FILE" ]; then return; fi
    if ! (
        touch "$STATE_FILE"
        TMP_STATE_FILE=$(mktemp)
        grep -v "^$1=" "$STATE_FILE" > "$TMP_STATE_FILE" || true
        echo "$1=$2" >> "$TMP_STATE_FILE"
        mv "$TMP_STATE_FILE" "$STATE_FILE"
    ); then
        warn "Could not write to state file: $STATE_FILE. Resuming will not be possible from this point."
    fi
}
read_state() {
    if [ -f "$STATE_FILE" ]; then
        info "Found previous state file. Resuming..."
        set -a; source "$STATE_FILE"; set +a
    fi
}

# --- Database Connectivity Helpers ---
start_sql_proxy() {
    info "Starting Cloud SQL Auth Proxy..."
    
    # 1. Get Instance Connection Name
    # Try Terraform output first, fallback to gcloud
    pushd "$REPO_ROOT/infra/environments/$ENV_NAME" > /dev/null
    DB_INSTANCE_NAME=$(terraform output -raw cloud_sql_connection_name 2>/dev/null)
    popd > /dev/null

    if [ -z "$DB_INSTANCE_NAME" ]; then
        DB_INSTANCE_NAME=$(gcloud sql instances list --format="value(connectionName)" --filter="name:creative-studio-db*" --project="$GCP_PROJECT_ID" | head -n 1)
    fi

    if [ -z "$DB_INSTANCE_NAME" ]; then
        fail "Could not find Cloud SQL instance. Ensure Terraform ran successfully."
    fi

    export INSTANCE_CONNECTION_NAME="$DB_INSTANCE_NAME"

    # 2. Download Proxy (if missing)
    if [ ! -f "cloud-sql-proxy" ]; then
        curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
        chmod +x cloud-sql-proxy
    fi

    # 3. Start Proxy in Background (Port 5432)
    ./cloud-sql-proxy --address 0.0.0.0 --port 5432 "$DB_INSTANCE_NAME" > /dev/null 2>&1 &
    PROXY_PID=$!
    export PROXY_PID
    
    # 4. Wait for Readiness
    echo -n "   Waiting for proxy connection..."
    for i in {1..15}; do
        if nc -z 127.0.0.1 5432 2>/dev/null; then
            echo " Connected!"
            return 0
        fi
        echo -n "."
        sleep 1
    done
    echo
    warn "Proxy connection check timed out, but proceeding..."
}

stop_sql_proxy() {
    if [ -n "$PROXY_PID" ]; then
        info "Stopping Cloud SQL Proxy..."
        kill "$PROXY_PID" 2>/dev/null || true
        unset PROXY_PID
    fi
}

export_db_vars() {
    # Fetch password from Secret Manager
    DB_PASS=$(gcloud secrets versions access latest --secret="creative-studio-db-password" --project="$GCP_PROJECT_ID")
    
    export DB_USER="studio_user"
    export DB_PASS="$DB_PASS"
    export DB_NAME="creative_studio"
    export DB_HOST="127.0.0.1" # Proxy address
    export DB_PORT="5432"
    export USE_CLOUD_SQL_AUTH_PROXY=true
}

# --- Script Functions ---
check_prerequisites() {
    step 1 "Checking Prerequisites"
    command -v gcloud >/dev/null || fail "gcloud CLI not found. Please install from https://cloud.google.com/sdk/docs/install"
    command -v git >/dev/null || fail "git not found. Please install it."
    if ! command -v jq &> /dev/null; then
        warn "The 'jq' command is required but not found."
        prompt "Would you like to try and install it now? (y/n)"; read -r REPLY < /dev/tty
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            warn "This may require sudo privileges."
			if command -v apt-get &>/dev/null; then sudo apt-get update && sudo apt-get install -y jq
			elif command -v brew &>/dev/null; then brew install jq
			elif command -v yum &>/dev/null; then sudo yum install -y jq
			else fail "Cannot automatically install jq on this OS. Please install it manually and run again."
			fi
        else fail "Please install jq and run this script again.";
		fi
    fi
    if ! command -v firebase &> /dev/null; then
        warn "Firebase CLI ('firebase-tools') is not installed. It is required for automation."
        prompt "Would you like to try and install it now via npm? (y/n)"; read -r REPLY < /dev/tty
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if ! command -v npm &> /dev/null; then fail "npm is required to install firebase-tools. Please install Node.js and npm first."; fi
            info "Installing firebase-tools globally..."; sudo npm install -g firebase-tools
        else
            fail "Please install firebase-tools (npm install -g firebase-tools) and run this script again."
        fi
    fi
    check_and_install_uv
    success "Prerequisites met. gcloud, git, jq, firebase and uv"
}

check_and_install_uv() {
    if command -v uv >/dev/null; then
        info "uv is already installed."
        return
    fi
    info "Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
}

get_platform_arch() {
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    case $ARCH in
        x86_64) ARCH="amd64" ;; aarch64) ARCH="arm64" ;; arm64) ARCH="arm64" ;;
    esac
    echo "${OS}_${ARCH}"
}

check_and_install_terraform() {
    step 2 "Checking Terraform Installation"
    if ! command -v terraform &> /dev/null; then
        warn "Terraform is not installed."
        install_terraform
        return
    fi
    INSTALLED_VERSION=$(terraform version -json | jq -r .terraform_version)
    if [[ "$(printf '%s\n' "$REQUIRED_TERRAFORM_VERSION" "$INSTALLED_VERSION" | sort -V | head -n1)" != "$REQUIRED_TERRAFORM_VERSION" ]]; then
        warn "Your Terraform version ($INSTALLED_VERSION) is older than the required version ($REQUIRED_TERRAFORM_VERSION)."
        install_terraform
    else
        success "Terraform version $INSTALLED_VERSION is sufficient."
    fi
}

install_terraform() {
    warn "Terraform is missing or outdated. The required version ($REQUIRED_TERRAFORM_VERSION) will be installed now."
    PLATFORM_ARCH=$(get_platform_arch)
    TF_ZIP_FILENAME="terraform_${REQUIRED_TERRAFORM_VERSION}_${PLATFORM_ARCH}.zip"
    TF_DOWNLOAD_URL="https://releases.hashicorp.com/terraform/${REQUIRED_TERRAFORM_VERSION}/${TF_ZIP_FILENAME}"
    info "Downloading Terraform for your platform (${PLATFORM_ARCH})..."
    curl -Lo terraform.zip "$TF_DOWNLOAD_URL"
    unzip -o terraform.zip
    info "Installing Terraform into the persistent ~/bin directory..."
    mkdir -p "$HOME/bin"
    mv terraform "$HOME/bin/"
    if ! grep -q 'export PATH="$HOME/bin:$PATH"' ~/.bashrc; then
        info "Adding ~/bin to your PATH in ~/.bashrc for future sessions..."
        echo -e '\n# Add local bin to PATH\nexport PATH="$HOME/bin:$PATH"' >> ~/.bashrc
    fi
    export PATH="$HOME/bin:$PATH"
    hash -r
    rm terraform.zip LICENSE.txt
    if command -v terraform &> /dev/null && [[ "$(terraform version -json | jq -r .terraform_version)" == "$REQUIRED_TERRAFORM_VERSION" ]]; then
        success "Terraform v$(terraform -version | head -n 1) is now active."
    else
        fail "Terraform installation failed. Please open a new terminal and run this script again."
    fi
}

setup_project() {
    step 3 "Configuring Google Cloud Project"

    # try detecting current project on the current terminal
    CURRENT_GCLOUD_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")

    if [ -n "$GCP_PROJECT_ID" ]; then
        prompt "Found project '$GCP_PROJECT_ID' from a previous run. Use this project? (y/n)"; read -r REPLY < /dev/tty
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            gcloud config set project "$GCP_PROJECT_ID"
            success "Project '$GCP_PROJECT_ID' is configured."
            return
        fi
    elif [ -n "$CURRENT_GCLOUD_PROJECT" ]; then
        prompt "Detected active gcloud project '$CURRENT_GCLOUD_PROJECT'. Use this project? (y/n)"
        read -r REPLY < /dev/tty
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            GCP_PROJECT_ID=$CURRENT_GCLOUD_PROJECT
            info "Using existing project '$GCP_PROJECT_ID'."
            gcloud config set project "$GCP_PROJECT_ID"
            success "Project '$GCP_PROJECT_ID' is configured."
            return
        fi
    fi
    prompt "Do you already have a Google Cloud Project to use? (y/n)"; read -r REPLY < /dev/tty
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        prompt "Please enter your existing Google Cloud Project ID:"; read -p "   Project ID: " GCP_PROJECT_ID < /dev/tty
    else
        prompt "What is the desired new Google Cloud Project ID? (e.g., my-creative-studio)"; read -p "   Project ID: " GCP_PROJECT_ID < /dev/tty
        prompt "What is your Google Cloud Billing Account ID? (Find it with 'gcloud beta billing accounts list')"; read -p "   Billing Account ID: " BILLING_ACCOUNT_ID < /dev/tty
        info "Creating project '$GCP_PROJECT_ID'..."; gcloud projects create "$GCP_PROJECT_ID" || warn "Project '$GCP_PROJECT_ID' may already exist. Continuing..."
        info "Linking billing account '$BILLING_ACCOUNT_ID'..."; gcloud beta billing projects link "$GCP_PROJECT_ID" --billing-account="$BILLING_ACCOUNT_ID"
    fi
    info "Setting gcloud config to use project '$GCP_PROJECT_ID'..."; gcloud config set project "$GCP_PROJECT_ID"
    success "Project '$GCP_PROJECT_ID' is configured."
}

setup_repo() {
    step 4 "Configuring Git Repository"

    # Since the script is run via curl, it never starts inside a repo. We must clone it.
    warn "Please fork the main repository first: ${UPSTREAM_REPO_URL}/fork"
    while true; do
        prompt "What is the git URL of YOUR forked repository? (e.g., https://github.com/user/repo.git)"
        read -p "   Git URL: " GITHUB_REPO_URL < /dev/tty
        if [ -z "$GITHUB_REPO_URL" ]; then warn "Repository URL cannot be empty."; continue; fi
        info "Validating repository URL..."
        if git ls-remote --exit-code -h "$GITHUB_REPO_URL" > /dev/null 2>&1; then
            success "Repository found."; break
        else warn "Repository not found at that URL. Please check for typos and try again."; fi
    done

    # --- Ask for Branch ---
    prompt "Which git branch would you like to use? (default: main)"
    read -p "   Branch Name: " SELECTED_BRANCH < /dev/tty
    SELECTED_BRANCH=${SELECTED_BRANCH:-main}
    DEFAULT_BRANCH_NAME="$SELECTED_BRANCH"

    local REPO_CLONE_DIR=$(basename "$GITHUB_REPO_URL" .git)

    if [[ -d "$REPO_CLONE_DIR" ]]; then
        warn "Directory '$REPO_CLONE_DIR' already exists."; prompt "Do you want to use this existing directory? (y/n)"; read -r REPLY < /dev/tty
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then fail "Please remove the directory or run the script from a different location."; fi
    else
        info "Performing a sparse checkout of '$REPO_CLONE_DIR' (Branch: $SELECTED_BRANCH)..."
        
        # 1. Clone with -b branch_name
        git clone --filter=blob:none --no-checkout --depth 1 --sparse -b "$SELECTED_BRANCH" "$GITHUB_REPO_URL" "$REPO_CLONE_DIR"
        
        cd "$REPO_CLONE_DIR"
        
        # 2. FIXED: Sparse checkout now includes ROOT folders AND the legacy subfolder
        # This ensures it works for both the mono-repo upstream and your flattened fork.
        git sparse-checkout set "examples/creative-studio" "infra" "backend" "frontend" "bootstrap.sh"
        
        git checkout
        cd ..

        success "Repository cloned successfully."
    fi

    # --- Automatic Project Path Detection ---
    info "Automatically detecting project structure..."
    local RELATIVE_PROJECT_PATH=""
    local FALLBACK_PATH="examples/creative-studio"

    # Check if the project is at the top level (Flattened Fork)
    if [[ -d "$REPO_CLONE_DIR/infra" && -f "$REPO_CLONE_DIR/bootstrap.sh" ]]; then
        info "Detected top-level project structure."
        RELATIVE_PROJECT_PATH=""
    # Check if the project is in the fallback nested path (Upstream Mono-repo)
    elif [[ -d "$REPO_CLONE_DIR/$FALLBACK_PATH/infra" && -f "$REPO_CLONE_DIR/$FALLBACK_PATH/bootstrap.sh" ]]; then
        info "Detected nested project structure at '$FALLBACK_PATH'."
        RELATIVE_PROJECT_PATH="$FALLBACK_PATH"
    else
        # Debugging aid if it fails again
        warn "Directory listing of clone:"
        ls -F "$REPO_CLONE_DIR/"
        fail "Could not find a valid project structure. The script requires an 'infra' directory and 'bootstrap.sh' file."
    fi

    # Define the final project path
    local FINAL_PROJECT_PATH="$REPO_CLONE_DIR"
    if [ -n "$RELATIVE_PROJECT_PATH" ]; then
        FINAL_PROJECT_PATH="$FINAL_PROJECT_PATH/$RELATIVE_PROJECT_PATH"
    fi

    if [ ! -d "$FINAL_PROJECT_PATH" ]; then
        fail "The specified project path '$FINAL_PROJECT_PATH' does not exist."
    fi
    cd "$FINAL_PROJECT_PATH"

    REPO_ROOT=$(pwd)
    export REPO_ROOT
    success "Project root successfully set to: $REPO_ROOT"

    GITHUB_REPO_OWNER=$(git remote get-url origin | sed -n 's/.*github.com\/\(.*\)\/.*/\1/p')
    GITHUB_REPO_NAME=$REPO_CLONE_DIR

    info "Detected GitHub owner: $GITHUB_REPO_OWNER"
    info "Detected GitHub repo name: $GITHUB_REPO_NAME"
}

configure_environment() {
    step 5 "Configuring Terraform Environment";
    cd "$REPO_ROOT/infra"
    if [ -z "$ENV_NAME" ]; then
        prompt "What would you like to call this deployment environment?"; read -p "   Environment Name [default value: $DEFAULT_ENV_NAME]: " ENV_NAME < /dev/tty
        ENV_NAME=${ENV_NAME:-$DEFAULT_ENV_NAME}
    else info "Using previously configured environment: $ENV_NAME"; fi
    ENV_DIR="environments/$ENV_NAME";
    TFVARS_FILE_PATH="$REPO_ROOT/infra/$ENV_DIR/$ENV_NAME.tfvars"
    STATE_FILE="$REPO_ROOT/infra/$ENV_DIR/.bootstrap_state";
    read_state
    if [ ! -d "$ENV_DIR" ]; then
        info "Creating new environment directory from template: $TEMPLATE_ENV_DIR"; cp -r "$TEMPLATE_ENV_DIR" "$ENV_DIR"
        prompt "Do you have an existing GCS bucket for Terraform state? (y/n)"; read -r REPLY < /dev/tty
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            prompt "Please enter the name of your GCS bucket:"; read -p "   Bucket Name: " BUCKET_NAME < /dev/tty
        else
            BUCKET_SUFFIX=$(printf "$GCS_BUCKET_SUFFIX_FORMAT" "$ENV_NAME"); BUCKET_NAME="${GCP_PROJECT_ID}-${BUCKET_SUFFIX}"
            info "Creating GCS bucket '$BUCKET_NAME' for Terraform state..."; gsutil mb -p "$GCP_PROJECT_ID" "gs://${BUCKET_NAME}" || warn "Bucket 'gs://${BUCKET_NAME}' may already exist. Continuing..."
        fi
        BUCKET_PREFIX=$(printf "$GCS_BUCKET_PREFIX_FORMAT" "$ENV_NAME")
        info "Updating backend.tf with default prefix: $BUCKET_PREFIX"; echo "terraform {
  backend \"gcs\" {
    bucket = \"$BUCKET_NAME\"
    prefix = \"$BUCKET_PREFIX\"
  }
}" > "$ENV_DIR/backend.tf"
        info "Updating $TFVARS_FILE_PATH...";
        mv "$ENV_DIR/dev.tfvars" "$TFVARS_FILE_PATH"

        sed -i.bak "s|^[#[:space:]]*gcp_project_id[[:space:]]*=.*|gcp_project_id = \"$GCP_PROJECT_ID\"|g" "$TFVARS_FILE_PATH"
        sed -i.bak "s|^[#[:space:]]*github_repo_owner[[:space:]]*=.*|github_repo_owner = \"$GITHUB_REPO_OWNER\"|g" "$TFVARS_FILE_PATH"
        sed -i.bak "s|^[#[:space:]]*github_repo_name[[:space:]]*=.*|github_repo_name = \"$GITHUB_REPO_NAME\"|g" "$TFVARS_FILE_PATH"

        # Set service names automatically
        info "Default service names will be '$BE_SERVICE_NAME' and '$FE_SERVICE_NAME'."
        sed -i.bak "s|^[#[:space:]]*backend_service_name[[:space:]]*=.*|backend_service_name = \"$BE_SERVICE_NAME\"|g" "$TFVARS_FILE_PATH"
        sed -i.bak "s|^[#[:space:]]*frontend_service_name[[:space:]]*=.*|frontend_service_name = \"$FE_SERVICE_NAME\"|g" "$TFVARS_FILE_PATH"

        # Prompt only for the branch name
        export TFVARS_FILE=$TFVARS_FILE_PATH # Set context for helper function
        prompt "Please provide the following value:"
        prompt_and_update_tfvar "GitHub Branch to deploy from" "$DEFAULT_BRANCH_NAME" "github_branch_name" "GITHUB_BRANCH"

        write_state "ENV_NAME" "$ENV_NAME"; write_state "BE_SERVICE_NAME" "$BE_SERVICE_NAME"; write_state "FE_SERVICE_NAME" "$FE_SERVICE_NAME"; write_state "GITHUB_BRANCH" "$GITHUB_BRANCH"
    else info "Environment directory '$ENV_DIR' already configured."; fi
    success "Configuration files for '$ENV_NAME' environment are ready."
}

handle_manual_steps() {
    step 6 "Manual Steps Required"; cd "$REPO_ROOT/infra"; TFVARS_FILE_PATH="$ENV_DIR/$ENV_NAME.tfvars"
    info "Enabling required Google Cloud APIs..."; gcloud services enable cloudbuild.googleapis.com secretmanager.googleapis.com firebase.googleapis.com iap.googleapis.com identitytoolkit.googleapis.com texttospeech.googleapis.com --project="$GCP_PROJECT_ID"
    if [ -z "$GITHUB_CONN_NAME" ]; then
        prompt "\nDo you already have a Cloud Build Host Connection for GitHub in this project? (y/n)"; read -r REPLY < /dev/tty
        if [[ $REPLY =~ ^[Yy]$ ]]; then prompt "Please enter the existing connection name:"; read -p "   Connection Name: " GITHUB_CONN_NAME < /dev/tty
        else
            warn "You will now be guided to create a new GitHub connection."; info "Please perform the following manual steps:"
            echo "1. Open this URL in your browser:"; echo -e "   ${C_YELLOW}https://console.cloud.google.com/cloud-build/connections/create?project=${GCP_PROJECT_ID}${C_RESET}"
            echo "2. Select 'GitHub (Cloud Build GitHub App)' and click 'CONTINUE'."
            echo "3. Follow the prompts to authorize the app on your GitHub account."; echo "4. Grant access to your forked repository: '${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}'."
            echo "5. After creating the connection, copy its name (e.g., 'gh-yourname-con')."
            prompt "Paste the new Cloud Build Connection Name here:"; read -p "   Connection Name: " GITHUB_CONN_NAME < /dev/tty
        fi
        sed -i.bak "s|^[#[:space:]]*github_conn_name[[:space:]]*=.*|github_conn_name = \"$GITHUB_CONN_NAME\"|g" "$TFVARS_FILE_PATH"
        write_state "GITHUB_CONN_NAME" "$GITHUB_CONN_NAME"
    fi
    warn "\nTerraform cannot accept legal terms on your behalf."; info "Please perform this one-time manual step for Firebase:"
    echo "1. Open this URL in your browser:"; echo -e "   ${C_YELLOW}https://console.firebase.google.com/?project=${GCP_PROJECT_ID}${C_RESET}"
    echo "2. You should be prompted to 'Add Firebase' to your existing project."; echo "3. Follow the prompts and accept the terms."
    prompt "Press [Enter] to continue after you have linked the project."; read -r < /dev/tty
    rm -f "$TFVARS_FILE_PATH.bak"

    # --- Automate .tfvars placeholder replacement ---
    info "\nConfiguring OAuth Client ID and Project ID in .tfvars file..."
    if [ -z "$AUTO_OAUTH_CLIENT_ID" ]; then
        warn "The OAuth Client ID is required for the .tfvars file."
        echo "1. Open this URL in your browser to find your OAuth Client ID:"
        echo -e "   ${C_YELLOW}https://console.cloud.google.com/apis/credentials?project=${GCP_PROJECT_ID}${C_RESET}"
        echo "2. Find the OAuth 2.0 Client ID of type 'Web application'."
        prompt "Paste the OAuth Client ID here:"
        read -p "   Client ID: " AUTO_OAUTH_CLIENT_ID < /dev/tty
        if [ -z "$AUTO_OAUTH_CLIENT_ID" ]; then fail "OAuth Client ID is required to proceed."; fi
    fi

    sed -i.bak "s|YOUR_OAUTH_WEB_CLIENT_ID_HERE|$AUTO_OAUTH_CLIENT_ID|g" "$TFVARS_FILE_PATH"
    sed -i.bak "s|YOUR_GCP_PROJECT_ID|$GCP_PROJECT_ID|g" "$TFVARS_FILE_PATH"
    success "Replaced placeholders in $TFVARS_FILE_PATH."
}

setup_firebase_app() {
    step 7 "Automating Firebase Web App Configuration"; cd "$REPO_ROOT"

    info "Checking for existing Firebase web app named '$FE_SERVICE_NAME'...";
    if ! firebase apps:list --project="$GCP_PROJECT_ID" | grep -q "$FE_SERVICE_NAME"; then
        info "No existing app found. Creating a new Firebase web app...";
		firebase apps:create WEB "$FE_SERVICE_NAME" --project="$GCP_PROJECT_ID"
    else info "Firebase web app '$FE_SERVICE_NAME' already exists."; fi

    info "Fetching Firebase SDK configuration to store in memory...";
	local APP_ID=$(firebase apps:list --project="$GCP_PROJECT_ID" --json | jq -r --arg name "$FE_SERVICE_NAME" '.result[] | select(.displayName == $name) | .appId')
    local SDK_CONFIG_JSON=$(firebase apps:sdkconfig WEB "$APP_ID" --project="$GCP_PROJECT_ID" --json)

    AUTO_FIREBASE_API_KEY=$(echo "$SDK_CONFIG_JSON" | jq -r '.result.sdkConfig.apiKey // empty')
    AUTO_FIREBASE_AUTH_DOMAIN=$(echo "$SDK_CONFIG_JSON" | jq -r '.result.sdkConfig.authDomain // empty')
    AUTO_FIREBASE_PROJECT_ID=$(echo "$SDK_CONFIG_JSON" | jq -r '.result.sdkConfig.projectId // empty')
    AUTO_FIREBASE_STORAGE_BUCKET=$(echo "$SDK_CONFIG_JSON" | jq -r '.result.sdkConfig.storageBucket // empty')
    AUTO_FIREBASE_MESSAGING_SENDER_ID=$(echo "$SDK_CONFIG_JSON" | jq -r '.result.sdkConfig.messagingSenderId // empty')
    AUTO_FIREBASE_APP_ID=$(echo "$SDK_CONFIG_JSON" | jq -r '.result.sdkConfig.appId // empty')
    AUTO_FIREBASE_MEASUREMENT_ID=$(echo "$SDK_CONFIG_JSON" | jq -r '.result.sdkConfig.measurementId // empty')

    if [ -z "$AUTO_FIREBASE_API_KEY" ]; then fail "Could not automatically fetch Firebase API Key. Please check your Firebase setup."; fi
    success "Firebase secrets have been fetched and will be populated automatically after Terraform runs."
}

populate_oauth_secrets() {
    step 8 "Automating OAuth Secret Population"
    cd "$REPO_ROOT"
    info "Looking for the OAuth 2.0 Web Client ID using the Firebase Management API..."

    local AUTH_TOKEN=$(gcloud auth print-access-token)
    local APP_ID=$(firebase apps:list --project="$GCP_PROJECT_ID" --json | jq -r --arg name "$FE_SERVICE_NAME" '.result[] | select(.displayName == $name) | .appId')

    if [ -z "$APP_ID" ]; then
        warn "Could not find Firebase App ID for '$FE_SERVICE_NAME'. Skipping OAuth secret population."
        return
    fi

    # Use the Firebase Management API to get the auth config, which includes the client ID.
    local API_RESPONSE=$(curl -s -X GET \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "https://firebase.googleapis.com/v1beta1/projects/$GCP_PROJECT_ID/webApps/$APP_ID/config")

    # The client ID is the one NOT associated with the API key.
    AUTO_OAUTH_CLIENT_ID=$(echo "$API_RESPONSE" | jq -r '.oauthClientId')

    if [ -z "$AUTO_OAUTH_CLIENT_ID" ] || [ "$AUTO_OAUTH_CLIENT_ID" == "null" ]; then
        warn "Could not automatically find the OAuth Client ID via API."
        info "Please perform the following manual steps:"
        echo "1. Open this URL in your browser to find your OAuth Client ID:"
        echo -e "   ${C_YELLOW}https://console.cloud.google.com/apis/credentials?project=${GCP_PROJECT_ID}${C_RESET}"
        echo "2. Find the OAuth 2.0 Client ID of type 'Web application'."
        prompt "Paste the OAuth Client ID here:"
        read -p "   Client ID: " AUTO_OAUTH_CLIENT_ID < /dev/tty
        if [ -z "$AUTO_OAUTH_CLIENT_ID" ]; then
            fail "OAuth Client ID is required to proceed. Please restart the script."
        fi
    else
        info "Found OAuth Client ID via Firebase API."
    fi

    info "Populating secrets with Client ID: ${C_YELLOW}${AUTO_OAUTH_CLIENT_ID}${C_RESET}"
    echo -n "$AUTO_OAUTH_CLIENT_ID" | gcloud secrets versions add GOOGLE_CLIENT_ID --data-file="-" --project="$GCP_PROJECT_ID" --quiet
    echo -n "$AUTO_OAUTH_CLIENT_ID" | gcloud secrets versions add GOOGLE_TOKEN_AUDIENCE --data-file="-" --project="$GCP_PROJECT_ID" --quiet
    success "Secrets 'GOOGLE_CLIENT_ID' and 'GOOGLE_TOKEN_AUDIENCE' have been populated."

    info "Updating audiences in $TFVARS_FILE_PATH..."
    sed -i.bak "s|your-custom-audience.apps.googleusercontent.com|$AUTO_OAUTH_CLIENT_ID|g" "$TFVARS_FILE_PATH"
    rm -f "$TFVARS_FILE_PATH.bak"
    success "Audiences updated in .tfvars file."
}

setup_db_secrets() {
    step 9 "Configuring Database Secrets" # Renumber subsequent steps
    
    # 1. Enable required APIs first
    info "Enabling Secret Manager and SQL Admin APIs..."
    gcloud services enable secretmanager.googleapis.com sqladmin.googleapis.com --project="$GCP_PROJECT_ID"

    local SECRET_NAME="creative-studio-db-password"
    
    # 2. Check if the secret already exists
    if gcloud secrets describe "$SECRET_NAME" --project="$GCP_PROJECT_ID" > /dev/null 2>&1; then
        info "Secret '$SECRET_NAME' already exists. Skipping creation."
    else
        info "Creating new secret '$SECRET_NAME'..."
        
        # 3. Generate a secure random password (alphanumeric, no special chars that break URLs)
        # using openssl. We use base64 but strip non-alphanumeric chars to be safe for DB connection strings
        local DB_PASSWORD=$(openssl rand -base64 20 | tr -dc 'a-zA-Z0-9' | head -c 16)
        
        # 4. Create the secret and add the first version
        # We use printf to avoid trailing newlines
        printf "%s" "$DB_PASSWORD" | gcloud secrets create "$SECRET_NAME" \
            --data-file=- \
            --replication-policy="automatic" \
            --project="$GCP_PROJECT_ID" \
            --quiet

        success "Secret '$SECRET_NAME' created successfully."
    fi
}

run_terraform() {
    step 10 "Deploying Infrastructure with Terraform";
	TFVARS_FILE_PATH="$REPO_ROOT/infra/environments/$ENV_NAME/$ENV_NAME.tfvars"; info "Navigating to $REPO_ROOT/infra/environments/$ENV_NAME..."; cd "$REPO_ROOT/infra/environments/$ENV_NAME"
    info "Initializing Terraform..."; terraform init -reconfigure
    info "Planning Terraform changes..."; terraform plan -var-file="$TFVARS_FILE_PATH"
    prompt "\nTerraform is ready to apply the changes. This will create the infrastructure, including empty secret shells."; prompt "Do you want to proceed with 'terraform apply'? (y/n)"; read -r REPLY < /dev/tty
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then warn "Apply cancelled."; return; fi
    terraform apply -auto-approve -var-file="$TFVARS_FILE_PATH" -parallelism=30
}

update_oauth_client() {
    step 11 "Configuring OAuth Client URIs"; cd "$REPO_ROOT"
    if [ -z "$AUTO_OAUTH_CLIENT_ID" ]; then warn "Could not find OAuth Client ID automatically. Skipping URI update."; return; fi
    info "Fetching full OAuth client name..."; local OAUTH_CLIENT_FULL_NAME=$(gcloud iap oauth-clients list "$GCP_PROJECT_ID" --format="json" | jq -r --arg clientid "$AUTO_OAUTH_CLIENT_ID" '.[] | select(.name | contains($clientid)) | .name')
    if [ -z "$OAUTH_CLIENT_FULL_NAME" ]; then warn "Could not resolve the full name for the OAuth client. Skipping URI update."; return; fi
    info "Ensuring OAuth Client has all required origins and redirect URIs..."; local PROJECT_DOMAIN_BASE=$(gcloud projects describe "$GCP_PROJECT_ID" --format='value(projectId)')
    local FIREBASEAPP_ORIGIN="https://${PROJECT_DOMAIN_BASE}.firebaseapp.com"; local WEBAPP_ORIGIN="https://${PROJECT_DOMAIN_BASE}.web.app"
    local FIREBASEAPP_REDIRECT_URI="${FIREBASEAPP_ORIGIN}/__/auth/handler"; local WEBAPP_REDIRECT_URI="${WEBAPP_ORIGIN}/__/auth/handler"
    gcloud iap oauth-clients update "$OAUTH_CLIENT_FULL_NAME" --add-javascript-origins="$FIREBASEAPP_ORIGIN" --add-javascript-origins="$WEBAPP_ORIGIN" --add-redirect-uris="$FIREBASEAPP_REDIRECT_URI" --add-redirect-uris="$WEBAPP_REDIRECT_URI" --project="$GCP_PROJECT_ID" --quiet
    success "OAuth Client URIs configured automatically."
}

update_secrets() {
    step 12 "Updating Remaining Secrets"; info "Navigating to $REPO_ROOT/infra/environments/$ENV_NAME..."; cd "$REPO_ROOT/infra/environments/$ENV_NAME"
    info "Populating values in Secret Manager..."; local TERRAFORM_OUTPUTS=$(terraform output -json)
    local FRONTEND_SECRETS=$(echo "$TERRAFORM_OUTPUTS" | jq -r .frontend_secrets.value[]); local BACKEND_SECRETS=$(echo "$TERRAFORM_OUTPUTS" | jq -r .backend_secrets.value[])
    local ALL_SECRETS=$(echo "${FRONTEND_SECRETS} ${BACKEND_SECRETS}" | tr ' ' '\n' | sort -u | grep .)
    if [ -z "$ALL_SECRETS" ]; then success "No secrets defined in Terraform outputs. Nothing to do."; return; fi

    # --- Double-check for Firebase config if variables are not set ---
    # This handles cases where the script is resumed after step 7
    if [ -z "$AUTO_FIREBASE_API_KEY" ]; then
        info "Auto-discovered Firebase variables not set. Re-running discovery..."
        local FE_APP_NAME=$(grep 'frontend_service_name' "$TFVARS_FILE_PATH" | awk -F'"' '{print $2}')
        if [ -z "$FE_APP_NAME" ]; then
            warn "Could not determine frontend service name from .tfvars. Cannot auto-discover Firebase secrets."
        else
            local APP_ID=$(firebase apps:list --project="$GCP_PROJECT_ID" --json | jq -r --arg name "$FE_SERVICE_NAME" '.result[] | select(.displayName == $name) | .appId')
            if [ -n "$APP_ID" ]; then
                local SDK_CONFIG_JSON=$(firebase apps:sdkconfig WEB "$APP_ID" --project="$GCP_PROJECT_ID" --json)
				AUTO_FIREBASE_API_KEY=$(echo "$SDK_CONFIG_JSON" | jq -r '.result.sdkConfig.apiKey // empty')
                # ... (re-populate all other AUTO_... variables)
				AUTO_FIREBASE_AUTH_DOMAIN=$(echo "$SDK_CONFIG_JSON" | jq -r '.result.sdkConfig.authDomain // empty')
				AUTO_FIREBASE_PROJECT_ID=$(echo "$SDK_CONFIG_JSON" | jq -r '.result.sdkConfig.projectId // empty')
				AUTO_FIREBASE_STORAGE_BUCKET=$(echo "$SDK_CONFIG_JSON" | jq -r '.result.sdkConfig.storageBucket // empty')
				AUTO_FIREBASE_MESSAGING_SENDER_ID=$(echo "$SDK_CONFIG_JSON" | jq -r '.result.sdkConfig.messagingSenderId // empty')
				AUTO_FIREBASE_APP_ID=$(echo "$SDK_CONFIG_JSON" | jq -r '.result.sdkConfig.appId // empty')
				AUTO_FIREBASE_MEASUREMENT_ID=$(echo "$SDK_CONFIG_JSON" | jq -r '.result.sdkConfig.measurementId // empty')
                success "Successfully re-discovered Firebase configuration."
            fi
        fi
    fi

    for SECRET_NAME in $ALL_SECRETS; do
        info "Processing secret: ${C_YELLOW}${SECRET_NAME}${C_RESET}"

        SECRET_VALUE=""
        AUTO_DISCOVERED=false

        # Check if we have an auto-discovered value for the current secret
        case $SECRET_NAME in
            "FIREBASE_API_KEY")               SECRET_VALUE=$AUTO_FIREBASE_API_KEY; AUTO_DISCOVERED=true ;;
            "FIREBASE_AUTH_DOMAIN")           SECRET_VALUE=$AUTO_FIREBASE_AUTH_DOMAIN; AUTO_DISCOVERED=true ;;
            "FIREBASE_PROJECT_ID")            SECRET_VALUE=$AUTO_FIREBASE_PROJECT_ID; AUTO_DISCOVERED=true ;;
            "FIREBASE_STORAGE_BUCKET")        SECRET_VALUE=$AUTO_FIREBASE_STORAGE_BUCKET; AUTO_DISCOVERED=true ;;
            "FIREBASE_MESSAGING_SENDER_ID")   SECRET_VALUE=$AUTO_FIREBASE_MESSAGING_SENDER_ID; AUTO_DISCOVERED=true ;;
            "FIREBASE_APP_ID")                SECRET_VALUE=$AUTO_FIREBASE_APP_ID; AUTO_DISCOVERED=true ;;
            "FIREBASE_MEASUREMENT_ID")        SECRET_VALUE=$AUTO_FIREBASE_MEASUREMENT_ID; AUTO_DISCOVERED=true ;;
            # GOOGLE_CLIENT_ID is handled by populate_oauth_secrets, so we skip it here
            "GOOGLE_CLIENT_ID")               info "  Value is handled by the OAuth population step. Skipping."; continue ;;
            "GOOGLE_TOKEN_AUDIENCE")          info "  Value is handled by the OAuth population step. Skipping."; continue ;;
        esac

        if [ "$AUTO_DISCOVERED" = true ] && [ -n "$SECRET_VALUE" ]; then
            info "  Value was auto-detected from Firebase. Populating automatically."
            echo -n "$SECRET_VALUE" | gcloud secrets versions add "$SECRET_NAME" --data-file="-" --project="$GCP_PROJECT_ID" --quiet
            success "  Successfully added new version for ${SECRET_NAME}."

        else
            # This fallback is now only for secrets that are not auto-discovered
            warn "  This secret requires manual input."
            echo -e "${C_CYAN}  It is safe to paste your secret. The value is read securely, not displayed, and not stored in history.${C_RESET}"
            read -s -p "  Enter new value: " SECRET_VALUE < /dev/tty; echo

            if [ -z "$SECRET_VALUE" ]; then warn "  No value provided. Skipping ${SECRET_NAME}."; continue; fi
            echo -n "$SECRET_VALUE" | gcloud secrets versions add "$SECRET_NAME" --data-file="-" --project="$GCP_PROJECT_ID" --quiet
            success "  Successfully added new version for ${SECRET_NAME}."
        fi
    done; success "All secrets have been populated."
}

seed_data() {
    step 13 "Seeding Initial Data (Workspaces, Templates, Assets)"

    info "The user running this script will be set as the owner of initial data."
    local CURRENT_USER=$(gcloud config get-value account 2>/dev/null)
    if [ -z "$CURRENT_USER" ]; then
      warn "Could not determine current gcloud user. Defaulting to 'system' owner in bootstrap script."
      CURRENT_USER="system"
    fi

    info "Project:      ${C_YELLOW}${GCP_PROJECT_ID}${C_RESET}"
    info "Deploying as: ${C_YELLOW}${CURRENT_USER}${C_RESET}"

    # Establish Database Connectivity
    export_db_vars
    start_sql_proxy
    # Ensure proxy stops even if this function fails
    trap stop_sql_proxy EXIT

    # Temporarily change to the project root so Python module resolution works
    pushd "$REPO_ROOT" > /dev/null

    # 1. Manually construct the CORRECT asset bucket name
    local ASSET_BUCKET_NAME="${GCP_PROJECT_ID}-cs-development-bucket"
    success "Using asset bucket: gs://${ASSET_BUCKET_NAME}"

    info "Setting bootstrap script environment variables..."
    export GOOGLE_CLOUD_PROJECT=$GCP_PROJECT_ID
    export ADMIN_USER_EMAIL=$CURRENT_USER
    export GENMEDIA_BUCKET=$ASSET_BUCKET_NAME

    local PYTHON_SCRIPT_PATH="backend/bootstrap/bootstrap.py"
    if [ ! -f "$PYTHON_SCRIPT_PATH" ]; then
        fail "Bootstrap script not found at: ${PYTHON_SCRIPT_PATH}"
    fi

    # --- Set up virtual environment and install dependencies using uv ---
    info "Setting up Python virtual environment for data seeding using uv..."
    VENV_DIR="$REPO_ROOT/backend/.venv"
    PYPROJECT_FILE="$REPO_ROOT/backend/pyproject.toml"

    if [ ! -f "$PYPROJECT_FILE" ]; then
        popd > /dev/null
        fail "Python project file not found at '$PYPROJECT_FILE'."
    fi

    # Create venv if it doesn't exist
    uv venv "$VENV_DIR" --python python3

    # Install dependencies from pyproject.toml into the virtual environment
    info "Installing Python project and its dependencies from 'backend/pyproject.toml'..."
    # Use an editable install (-e) to ensure all project dependencies are installed.
    uv pip install --python "$VENV_DIR/bin/python" -e backend

    info "Executing Python bootstrap script..."
    # We `cd` into the backend directory so that relative paths to assets inside the python script resolve correctly.
    # The editable install ensures that `from src...` imports work without needing PYTHONPATH.
    if (cd backend && "$VENV_DIR/bin/python" -m bootstrap.bootstrap); then
        success "Python bootstrap script executed successfully."
    else
        fail "Python bootstrap script failed."
    fi

    # Return to the original directory
    popd > /dev/null

    # Cleanup
    stop_sql_proxy
    trap - EXIT
}



trigger_builds() {
    step 14 "Triggering Initial Builds"; cd "$REPO_ROOT"
    prompt "Would you like to trigger the initial builds for the frontend and backend now? (y/n)"; read -r REPLY < /dev/tty
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then info "You can trigger the builds manually later by pushing a commit or via the Cloud Build UI."; return; fi
    info "Triggering backend build..."; gcloud builds triggers run "${BE_SERVICE_NAME}-trigger" --branch="$GITHUB_BRANCH" --project="$GCP_PROJECT_ID" --region="us-central1"
    info "Triggering frontend build..."; gcloud builds triggers run "$GCP_PROJECT_ID-trigger" --branch="$GITHUB_BRANCH" --project $GCP_PROJECT_ID --region="us-central1"

    success "Builds have been triggered."; info "You can monitor their progress in the Cloud Build console:"; echo -e "   ${C_YELLOW}https://console.cloud.google.com/cloud-build/builds?project=${GCP_PROJECT_ID}${C_RESET}"
}

# --- Main Execution ---
main() {
    echo -e "${C_GREEN}============================================================${C_RESET}"
    echo -e "${C_GREEN} 🚀  Welcome to the Creative Studio Infrastructure Setup 🚀 ${C_RESET}"
    echo -e "${C_GREEN}============================================================${C_RESET}"

    echo -e "${C_BLUE}"
    echo -e " ██████ ██████  ███████  █████  ████████ ██ ██    ██ ███████     ███████ ████████ ██    ██ ██████  ██  ██████  "
    echo -e "██      ██   ██ ██      ██   ██    ██    ██ ██    ██ ██          ██         ██    ██    ██ ██   ██ ██ ██    ██ "
    echo -e "██      ██████  █████   ███████    ██    ██ ██    ██ █████       ███████    ██    ██    ██ ██   ██ ██ ██    ██ "
    echo -e "██      ██   ██ ██      ██   ██    ██    ██  ██  ██  ██               ██    ██    ██    ██ ██   ██ ██ ██    ██ "
    echo -e " ██████ ██   ██ ███████ ██   ██    ██    ██   ████   ███████     ███████    ██     ██████  ██████  ██  ██████   "
    echo -e "${C_RESET}"

    read_state; LAST_COMPLETED_STEP=${LAST_COMPLETED_STEP:-0}
    declare -a steps_to_run=(
        "check_prerequisites"
        "check_and_install_terraform"
        "setup_project" "setup_repo"
        "configure_environment"
        "handle_manual_steps"
        "setup_firebase_app"
        "setup_db_secrets"
        "run_terraform"
        "populate_oauth_secrets"
        "update_oauth_client"
        "update_secrets"
        "seed_data"
        "trigger_builds" 
    )
    for i in "${!steps_to_run[@]}"; do
        step_num=$((i + 1))
        if (( LAST_COMPLETED_STEP < step_num )); then
            if [ -z "$STATE_FILE" ] && [ "$step_num" -gt 4 ]; then
                STATE_FILE="$REPO_ROOT/infra/environments/$ENV_NAME/.bootstrap_state"
                write_state "REPO_ROOT" "$REPO_ROOT"
            fi
            ${steps_to_run[$i]}; write_state "LAST_COMPLETED_STEP" "$step_num"
        fi
    done

    step 14 "🎉 Deployment Complete! 🎉";
    info "Fetching your application URLs...";
    cd "$REPO_ROOT/infra/environments/$ENV_NAME"

    # Try to get the frontend URL from terraform output, but handle the error
    FRONTEND_URL=$(terraform output -raw frontend_service_url 2>/dev/null || echo "")
    if [ -z "$FRONTEND_URL" ]; then
        warn "Could not find 'frontend_service_url' in Terraform outputs. Deducing from project ID."
        # Construct the default Firebase Hosting URL
        FRONTEND_URL="https://$(echo "$GCP_PROJECT_ID" | tr '[:upper:]' '[:lower:]').web.app"
    fi

    # Get the backend URL
    BACKEND_URL=$(terraform output -raw backend_service_url 2>/dev/null || echo "")
    if [ -z "$BACKEND_URL" ]; then
        warn "Could not find 'backend_service_url' in Terraform outputs."
    fi

    success "Your infrastructure is ready."
    echo "------------------------------------------------------------------"; echo -e "   Frontend URL: ${C_YELLOW}${FRONTEND_URL}${C_RESET}"; echo -e "   Backend URL:  ${C_YELLOW}${BACKEND_URL}${C_RESET}"; echo "------------------------------------------------------------------"
    info "It may take a few minutes for the builds to complete and the services to become available."

    echo # Add a blank line for spacing
    info "Thanks for using Creative Studio!"
    info "We'd love your feedback: ${C_YELLOW}https://docs.google.com/forms/d/e/1FAIpQLSceWvu7G354h-dTbOGvNGEraEjcUAgPE300WNY5qr-WJbh3Eg/viewform${C_RESET}"
    echo -e "${C_GREEN}============================================================${C_RESET}"
}

main "$@"
