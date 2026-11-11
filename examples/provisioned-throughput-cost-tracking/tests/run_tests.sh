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

# Offline unit tests for scripts/common.sh, SQL template rendering, Terraform
# defaults, notebook hygiene, and identifier sanitization.
set -euo pipefail

EXAMPLE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PASS_COUNT=0

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf '  [PASS] %s\n' "$1"
}

fail() {
  printf '  [FAIL] %s\n' "$1" >&2
  exit 1
}

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

# 1. Test common.sh config loading, service-account naming, and endpoint routing
cat > "$TMP_DIR/config.env" <<'EOF'
PROJECT_ID="unit-test-proj"
LOCATION="global"
MODEL="gemini-3.8-flash"
TEAMS="alpha beta gamma"
DATASET="gemini_usage"
BQ_LOCATION="US"
SINK_NAME="gemini-usage-sink"
BILLING_TABLE="bill-proj.bill_ds.gcp_billing_export_resource_v1_XXXXXX_XXXXXX_XXXXXX"
EOF

# shellcheck disable=SC1091
CONFIG="$TMP_DIR/config.env" source "$EXAMPLE_DIR/scripts/common.sh"

[[ "$(sa_email "alpha")" == "alpha-sa@unit-test-proj.iam.gserviceaccount.com" ]] \
  || fail "sa_email helper mismatch"
[[ "$API_HOST" == "aiplatform.googleapis.com" ]] \
  || fail "global endpoint should map to aiplatform.googleapis.com"
[[ "[\"${TEAMS// /\",\"}\"]" == '["alpha","beta","gamma"]' ]] \
  || fail "TEAMS array parameter formatting mismatch"
pass "common.sh helpers (sa_email, global API_HOST, TEAMS array formatting)"

sed 's/LOCATION="global"/LOCATION="us-central1"/' "$TMP_DIR/config.env" > "$TMP_DIR/regional.env"
REGIONAL_HOST="$(CONFIG="$TMP_DIR/regional.env" bash -c "source '$EXAMPLE_DIR/scripts/common.sh' && printf '%s' \"\$API_HOST\"")"
[[ "$REGIONAL_HOST" == "us-central1-aiplatform.googleapis.com" ]] \
  || fail "regional endpoint should map to us-central1-aiplatform.googleapis.com"
pass "common.sh regional API_HOST routing"

# 2. Test SQL template rendering across all 8 queries
SQL_COUNT=0
for sql_file in "$EXAMPLE_DIR"/sql/*.sql; do
  SQL_COUNT=$((SQL_COUNT + 1))
  rendered="$(render_sql "$sql_file")"
  if grep -qE '\$\{[A-Z_]+\}' <<< "$rendered"; then
    fail "Unresolved envsubst variable in $(basename "$sql_file")"
  fi
  grep -qE '(SELECT|WITH)' <<< "$rendered" || fail "Missing SELECT/WITH in $(basename "$sql_file")"
  grep -q ';' <<< "$rendered" || fail "Missing trailing semicolon in $(basename "$sql_file")"
done
[[ "$SQL_COUNT" -eq 8 ]] || fail "Expected 8 SQL files, found $SQL_COUNT"
grep -q '@fixed_fee' "$EXAMPLE_DIR/sql/monthly_allocation.sql" || fail "Missing @fixed_fee parameter"
grep -q '@month_start' "$EXAMPLE_DIR/sql/monthly_allocation.sql" || fail "Missing @month_start parameter"
grep -q '@allowed_values' "$EXAMPLE_DIR/sql/label_validation.sql" || fail "Missing @allowed_values parameter"
pass "All $SQL_COUNT SQL templates render cleanly with zero unresolved variables"

# 3. Test Terraform safe defaults
grep -A4 'variable "delete_contents_on_destroy"' "$EXAMPLE_DIR/terraform/variables.tf" \
  | grep -qE 'default[[:space:]]*=[[:space:]]*false' || fail "delete_contents_on_destroy must default to false"
grep -A4 'variable "enable_prompt_logging"' "$EXAMPLE_DIR/terraform/variables.tf" \
  | grep -qE 'default[[:space:]]*=[[:space:]]*false' || fail "enable_prompt_logging must default to false"
pass "Terraform safety defaults (delete_contents_on_destroy=false, enable_prompt_logging=false)"

# 4. Test notebook structure and cleared outputs
NB="$EXAMPLE_DIR/notebooks/gemini_cost_attribution.ipynb"
[[ "$(jq -r '.nbformat' "$NB")" == "4" ]] || fail "Notebook nbformat must be 4"
jq -r '.cells[0].source | join("")' "$NB" | grep -q "Copyright 2026 Google LLC" \
  || fail "Notebook missing Apache 2.0 header cell"
DIRTY_CELLS="$(jq '[.cells[] | select(.cell_type=="code" and ((.outputs | length) > 0 or .execution_count != null))] | length' "$NB")"
[[ "$DIRTY_CELLS" -eq 0 ]] || fail "Notebook has $DIRTY_CELLS code cells with uncleared outputs"
pass "Notebook JSON schema, license header, and clean code-cell outputs"

# 5. Test identifier leak check
bash "$EXAMPLE_DIR/tools/check_no_ids.sh" >/dev/null
pass "Identifier sanitization check (tools/check_no_ids.sh)"

printf '\nAll %d unit test suites passed.\n' "$PASS_COUNT"
