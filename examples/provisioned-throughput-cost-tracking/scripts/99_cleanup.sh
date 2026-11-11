#!/usr/bin/env bash

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

# Removes what 01_setup.sh created. Deleting the dataset deletes the logs permanently.
# shellcheck disable=SC1091,SC2153
source "$(dirname "$0")/common.sh"
read -r -p "This deletes dataset ${PROJECT_ID}:${DATASET}, sink ${SINK_NAME} and the team service accounts. Type 'delete' to continue: " ANSWER
[[ "$ANSWER" == "delete" ]] || { echo "Cancelled."; exit 1; }

step "Turn off inference request metadata logs for the project"
curl -sS -X POST -H "Authorization: Bearer $(token)" -H "Content-Type: application/json" \
  "https://aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}:setPublisherModelConfig" \
  -d '{"publisherModelConfig": {"inferenceEventLoggingConfig": {"state": "DISABLED"}}, "updateMask": "inferenceEventLoggingConfig"}' \
  | jq -c '{operation: .name, error: .error.message}'

if [[ "$PROMPT_LOGGING" == "true" ]]; then
  step "Turn off prompt and response logging for $MODEL"
  curl -sS -X POST -H "Authorization: Bearer $(token)" -H "Content-Type: application/json" \
    "https://${API_HOST}/v1beta1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:setPublisherModelConfig" \
    -d '{"publisherModelConfig": {"loggingConfig": {"enabled": false}}, "updateMask": "loggingConfig"}' \
    | jq -c '{operation: .name, error: .error.message}'
fi

step "Delete the log sink and the dataset"
"${GCLOUD[@]}" logging sinks delete "$SINK_NAME" --project="$PROJECT_ID" || true
bq --project_id="$PROJECT_ID" rm -r -f -d "$PROJECT_ID:$DATASET" || true

step "Delete the team service accounts"
for TEAM in $TEAMS; do
  "${GCLOUD[@]}" projects remove-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$(sa_email "$TEAM")" \
    --role="roles/aiplatform.user" --condition=None --format=none || true
  "${GCLOUD[@]}" iam service-accounts delete "$(sa_email "$TEAM")" --project="$PROJECT_ID" || true
done
step "Done."
