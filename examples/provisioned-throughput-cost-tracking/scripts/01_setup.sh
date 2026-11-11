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

# Sets up per-team usage tracking in a shared project. Safe to run more than once.
# shellcheck disable=SC1090,SC1091,SC2153
source "$(dirname "$0")/common.sh"

step "1. Enable the APIs"
"${GCLOUD[@]}" services enable aiplatform.googleapis.com bigquery.googleapis.com logging.googleapis.com --project="$PROJECT_ID"
ok "APIs enabled"

step "2. Create one service account per team"
for TEAM in $TEAMS; do
  if "${GCLOUD[@]}" iam service-accounts describe "$(sa_email "$TEAM")" --project="$PROJECT_ID" >/dev/null 2>&1; then
    ok "$(sa_email "$TEAM") already exists"
  else
    "${GCLOUD[@]}" iam service-accounts create "${TEAM}-sa" --display-name="${TEAM}-sa" --project="$PROJECT_ID"
  fi
done

step "3. Let each team call Gemini (roles/aiplatform.user)"
for TEAM in $TEAMS; do
  retry "${GCLOUD[@]}" projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$(sa_email "$TEAM")" \
    --role="roles/aiplatform.user" --condition=None --format=none
  ok "$(sa_email "$TEAM") can call Gemini"
  if [[ -n "${CALLER_MEMBER:-}" ]]; then
    retry "${GCLOUD[@]}" iam service-accounts add-iam-policy-binding "$(sa_email "$TEAM")" --project="$PROJECT_ID" \
      --member="$CALLER_MEMBER" --role="roles/iam.serviceAccountTokenCreator" --format=none
    ok "$CALLER_MEMBER can impersonate $(sa_email "$TEAM") for sample requests"
  fi
done


step "4. Create the BigQuery dataset"
if bq --project_id="$PROJECT_ID" show "$PROJECT_ID:$DATASET" >/dev/null 2>&1; then
  ok "dataset $DATASET already exists"
else
  bq --project_id="$PROJECT_ID" mk -d --location="$BQ_LOCATION" "$PROJECT_ID:$DATASET"
fi

# Calls setPublisherModelConfig and treats "already exists" (same settings) as success.
set_model_config() {
  local url="$1" body="$2" err
  err=$(curl -sS -X POST -H "Authorization: Bearer $(token)" -H "Content-Type: application/json" "$url" -d "$body" \
    | jq -r '.error.message // empty')
  [[ -z "$err" || "$err" == *"already exists"* ]] || { echo "    failed: $err" >&2; exit 1; }
}

step "5. Turn on inference request metadata logs for every model in the project"
# One entry per request: calling account, labels, traffic type, token counts and Provisioned Throughput burndown.
# It never records prompts or responses.
set_model_config "https://aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}:setPublisherModelConfig" \
  '{"publisherModelConfig": {"inferenceEventLoggingConfig": {"state": "ENABLED"}}, "updateMask": "inferenceEventLoggingConfig"}'
ok "metadata logs on (log name: aiplatform.googleapis.com/inference_request)"

step "6. Copy the metadata logs to BigQuery (log sink)"
TMP="$(mktemp -d)"
FILTER="logName=\"projects/${PROJECT_ID}/logs/aiplatform.googleapis.com%2Finference_request\""
if ! "${GCLOUD[@]}" logging sinks describe "$SINK_NAME" --project="$PROJECT_ID" >/dev/null 2>&1; then
  "${GCLOUD[@]}" logging sinks create "$SINK_NAME" "bigquery.googleapis.com/projects/$PROJECT_ID/datasets/$DATASET" \
    --use-partitioned-tables --log-filter="$FILTER" --project="$PROJECT_ID"
fi
WRITER="$("${GCLOUD[@]}" logging sinks describe "$SINK_NAME" --project="$PROJECT_ID" --format='value(writerIdentity)')"
# Grant the sink writer WRITER (BigQuery Data Editor) on the dataset through the dataset's access list.
bq --project_id="$PROJECT_ID" show --format=prettyjson "$PROJECT_ID:$DATASET" > "$TMP/dataset.json"
jq --arg sa "${WRITER#serviceAccount:}" '.access |= ((map(select(.userByEmail != $sa))) + [{"role": "WRITER", "userByEmail": $sa}])' \
  "$TMP/dataset.json" > "$TMP/dataset-new.json"
bq --project_id="$PROJECT_ID" update --source "$TMP/dataset-new.json" "$PROJECT_ID:$DATASET" >/dev/null
ok "sink $SINK_NAME writes to $DATASET.$USAGE_TABLE as $WRITER"

if [[ "$PROMPT_LOGGING" == "true" ]]; then
  step "7. (Optional) Log full prompts and responses for $MODEL"
  set_model_config "https://${API_HOST}/v1beta1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:setPublisherModelConfig" \
    "{\"publisherModelConfig\": {\"loggingConfig\": {\"enabled\": true, \"samplingRate\": 1.0,
      \"bigqueryDestination\": {\"outputUri\": \"bq://${PROJECT_ID}.${DATASET}.${PROMPT_TABLE}\"}}}, \"updateMask\": \"loggingConfig\"}"
  ok "prompts and responses for $MODEL go to $DATASET.$PROMPT_TABLE"
fi

step "Done. Role changes can take one to two minutes. Next: scripts/02_send_sample_requests.sh"
