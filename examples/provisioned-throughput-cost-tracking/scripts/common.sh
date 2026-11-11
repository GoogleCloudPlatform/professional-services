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

# Shared helpers for the setup scripts.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
CONFIG="${CONFIG:-$HERE/config.env}"
[[ -f "$CONFIG" ]] || { echo "Missing $CONFIG. Copy config.env.example to config.env and edit it." >&2; exit 1; }
# shellcheck disable=SC1090
source "$CONFIG"
: "${PROJECT_ID:?Set PROJECT_ID in config.env}"
USAGE_TABLE="${USAGE_TABLE:-aiplatform_googleapis_com_inference_request}"
PROMPT_LOGGING="${PROMPT_LOGGING:-false}"
PROMPT_TABLE="${PROMPT_TABLE:-prompt_response_log}"
BILLING_TABLE="${BILLING_TABLE:-}"
TEAMS="${TEAMS:-team-a team-b}"
export ROOT PROJECT_ID LOCATION MODEL TEAMS DATASET USAGE_TABLE BQ_LOCATION SINK_NAME BILLING_TABLE

GCLOUD=(gcloud --quiet)
[[ -n "${GCLOUD_ACCOUNT:-}" ]] && GCLOUD+=("--account=$GCLOUD_ACCOUNT")

if [[ "$LOCATION" == "global" ]]; then API_HOST="aiplatform.googleapis.com"; else API_HOST="${LOCATION}-aiplatform.googleapis.com"; fi
export API_HOST

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[0;32m    ok:\033[0m %s\n' "$*"; }
sa_email() { echo "$1-sa@${PROJECT_ID}.iam.gserviceaccount.com"; }
token() { "${GCLOUD[@]}" auth print-access-token 2>/dev/null; }

# Retries a command. New service accounts can take up to a minute before IAM accepts them.
retry() {
  local n=1 max=8
  until "$@"; do
    (( n >= max )) && { echo "Failed after $max attempts: $*" >&2; return 1; }
    echo "    waiting for IAM to catch up (attempt $n of $max)..." >&2; sleep 10; n=$((n + 1))
  done
}

# Render a SQL file: replaces ${PROJECT_ID}, ${DATASET}, ${USAGE_TABLE}, ${BILLING_TABLE}.
# shellcheck disable=SC2016
render_sql() { envsubst '${PROJECT_ID} ${DATASET} ${USAGE_TABLE} ${BILLING_TABLE}' < "$1"; }
run_sql() {
  local file="$1"; shift
  render_sql "$file" | bq --project_id="$PROJECT_ID" query --use_legacy_sql=false --format=pretty "$@"
}
