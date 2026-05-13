#!/bin/bash

# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -e

# Load .env file to find the bucket name
if [ -f .env ]; then
  export "$(grep -v '^#' .env | xargs)"
fi

BUCKET_NAME="${1:-$GCP_GCS_BUCKET}"

if [ -z "$BUCKET_NAME" ]; then
  echo "Error: No bucket name found."
  echo "Usage: ./scripts/setup_gcs_lifecycle.sh [BUCKET_NAME]"
  echo "Or ensure GCP_GCS_BUCKET is set in your .env file."
  exit 1
fi

# Remove gs:// prefix if present
BUCKET_NAME=${BUCKET_NAME#gs://}

echo "Configuring lifecycle policy for gs://$BUCKET_NAME..."

# Create a temporary JSON config for the lifecycle policy
cat > lifecycle_config.json <<EOF
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 1}
    }
  ]
}
EOF

# Apply the policy
if gcloud storage buckets update "gs://$BUCKET_NAME" --lifecycle-file=lifecycle_config.json; then
  echo "✅ Successfully applied 1-day retention policy to gs://$BUCKET_NAME"
else
  echo "❌ Failed to update bucket policy. Ensure you have Storage Admin permissions."
fi

# Cleanup
rm lifecycle_config.json
