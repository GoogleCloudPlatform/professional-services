#!/bin/bash

# This script deletes all descendant custom Security Health Analytics (SHA)
# modules under a specified GCP Organization, Folder, or Project via command line arguments.

# Exit immediately if a command exits with a non-zero status.
set -e
set -o pipefail

# --- Helper Functions ---

function show_help {
    echo "Usage: $0 [OPTION]..."
    echo "Delete descendant custom SHA modules for a specific scope."
    echo ""
    echo "Options (provide exactly one):"
    echo "  --organization <ID>   Target a GCP Organization ID."
    echo "  --folder <ID>         Target a GCP Folder ID."
    echo "  --project <ID>        Target a GCP Project ID."
    echo ""
    echo "  -h, --help            Show this help message."
    echo ""
    echo "Examples:"
    echo "  $0 --project my-prod-project"
    echo "  $0 --folder 1234567890"
}

ORGANIZATION_ID=""
FOLDER_ID=""
PROJECT_ID=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --organization) ORGANIZATION_ID="$2"; shift ;;
        --folder)       FOLDER_ID="$2";       shift ;;
        --project)      PROJECT_ID="$2";      shift ;;
        -h|--help)      show_help; exit 0 ;;
        *) echo "❌ Unknown parameter passed: $1"; show_help; exit 1 ;;
    esac
    shift
done

# Ensure jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ Error: 'jq' is not installed. Please install it to run this script."
    exit 1
fi

# Check how many scopes were provided (must be exactly 1)
SCOPE_COUNT=0
[[ -n "$ORGANIZATION_ID" ]] && ((SCOPE_COUNT++))
[[ -n "$FOLDER_ID" ]]       && ((SCOPE_COUNT++))
[[ -n "$PROJECT_ID" ]]      && ((SCOPE_COUNT++))

if [[ "$SCOPE_COUNT" -ne 1 ]]; then
    echo "❌ Error: You must provide exactly one scope (--organization, --folder, OR --project)."
    echo "Run '$0 --help' for usage details."
    exit 1
fi

# Configure the specific gcloud flag and display variables
if [[ -n "$ORGANIZATION_ID" ]]; then
    PARENT_TYPE="Organization"
    PARENT_ID="$ORGANIZATION_ID"
    SCOPE_FLAG="--organization="organizations/$ORGANIZATION_ID""
elif [[ -n "$FOLDER_ID" ]]; then
    PARENT_TYPE="Folder"
    PARENT_ID="$FOLDER_ID"
    SCOPE_FLAG="--folder=$FOLDER_ID"
elif [[ -n "$PROJECT_ID" ]]; then
    PARENT_TYPE="Project"
    PARENT_ID="$PROJECT_ID"
    SCOPE_FLAG="--project=$PROJECT_ID"
fi


echo "🔹 Fetching all descendant custom SHA modules for $PARENT_TYPE '$PARENT_ID'..."
MODULES_TO_DELETE=$(gcloud scc manage custom-modules sha list-descendant \
  "$SCOPE_FLAG" \
  --format="json" | jq -r '.[].name')

# Check if any modules were found.
if [ -z "$MODULES_TO_DELETE" ]; then
  echo "✅ No custom SHA modules found to delete in $PARENT_TYPE $PARENT_ID."
  exit 0
fi

echo "🔍 The following custom modules will be deleted:"
echo "--------------------------------------------------"
echo "$MODULES_TO_DELETE"
echo "--------------------------------------------------"
echo ""

# Ask for user confirmation before proceeding.
read -p "Are you absolutely sure you want to delete all these modules? This action cannot be undone. (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deletion cancelled by user."
    exit 1
fi

echo ""
echo "🔥 Starting deletion process..."

for module_name in $MODULES_TO_DELETE; do
  echo "   - Deleting module: $module_name"
  gcloud scc manage custom-modules sha delete "$module_name" --quiet
  echo "   ✔ Successfully deleted."
done

echo ""
echo "🎉 All identified custom SHA modules have been deleted."