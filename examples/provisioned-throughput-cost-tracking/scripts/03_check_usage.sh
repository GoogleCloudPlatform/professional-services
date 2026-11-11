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

# Shows each team's usage from the inference request metadata log and, if BILLING_TABLE is set,
# cost from the Cloud Billing export.
# shellcheck disable=SC1091,SC2153
source "$(dirname "$0")/common.sh"
SQL="$ROOT/sql"

step "Requests and tokens per account (metadata log)"
run_sql "$SQL/usage_by_account.sql"

step "Reserved capacity (PROVISIONED_THROUGHPUT) and pay-as-you-go tokens per account and model"
run_sql "$SQL/usage_by_account_and_traffic_type.sql"

step "Tokens per team label (request label and header label)"
run_sql "$SQL/usage_by_label.sql"

step "Failed requests per account (for example 429 when capacity is used up)"
run_sql "$SQL/rejected_requests.sql"

if [[ -n "${BILLING_TABLE:-}" ]]; then
  step "Cost per team label (billing export; new usage can take about 1.5 days to appear)"
  run_sql "$SQL/cost_by_label.sql"
  step "Share of Gemini cost with no team label"
  run_sql "$SQL/unattributed_cost.sql"
  step "Label values that are not on the allowed list"
  run_sql "$SQL/label_validation.sql" --parameter="allowed_values:ARRAY<STRING>:[\"${TEAMS// /\",\"}\"]"
else
  echo "Set BILLING_TABLE in config.env to also check the billing export."
fi
