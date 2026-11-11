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

# Sends sample Gemini requests as each team and prints the token counts. Each round sends one request with a
# "consumer" label (reaches the billing export), one with a header label (log only) and one with no label.
# Usage: scripts/02_send_sample_requests.sh [requests_per_team]
# shellcheck disable=SC1091,SC2153
source "$(dirname "$0")/common.sh"
N="${1:-3}"
URL="https://${API_HOST}/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent"

call() { # team token labels prompt; labels is a JSON object, "header" or "none"
  local labels="" header=()
  case "$3" in
    none) ;;
    header) header=(-H "x-goog-agent-platform-observability-label-team: $1") ;;
    *) labels="\"labels\": $3," ;;
  esac
  curl -sS -X POST -H "Authorization: Bearer $2" -H "Content-Type: application/json" "${header[@]}" "$URL" -d "{
      \"contents\": [{\"role\": \"user\", \"parts\": [{\"text\": \"$4\"}]}], $labels
      \"generationConfig\": {\"maxOutputTokens\": 300}}" |
    jq -r --arg t "$1" --arg l "$3" '[$t, $l, (.usageMetadata.totalTokenCount // "ERROR: " + (.error.message // "unknown")),
      (.usageMetadata.trafficType // "-")] | @tsv'
}

printf 'team\tlabels\ttotal_tokens\ttraffic_type\n'
for TEAM in $TEAMS; do
  T="$("${GCLOUD[@]}" auth print-access-token --impersonate-service-account="$(sa_email "$TEAM")" 2>/dev/null)" || {
    echo "Cannot impersonate $(sa_email "$TEAM"). Set CALLER_MEMBER and rerun 01_setup.sh, then wait a minute." >&2; exit 1; }
  for i in $(seq 1 "$N"); do
    call "$TEAM" "$T" "{\"consumer\": \"$TEAM\"}" "In about 80 words, explain request labels for cost tracking (sample $i)."
    call "$TEAM" "$T" header "In one sentence, what is a log sink? (sample $i)"
    call "$TEAM" "$T" none "In one sentence, what is a service account? (sample $i)"
  done
done
echo
echo "Rows appear in ${PROJECT_ID}.${DATASET}.${USAGE_TABLE} within a few minutes. Next: scripts/03_check_usage.sh"
