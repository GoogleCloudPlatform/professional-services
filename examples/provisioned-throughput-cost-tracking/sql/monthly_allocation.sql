-- Copyright 2026 Google LLC
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--     https://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.

-- Splits the Provisioned Throughput fixed fee for one month by each account's share of reserved-capacity use.
-- Run with: --parameter=fixed_fee:FLOAT64:10000 --parameter=month_start:DATE:2026-12-01
-- The basis is the Provisioned Throughput burndown (pt_charged tokens) recorded on each request, which already
-- reflects the different rates for input, output, cached and thinking tokens. Overflow usage is billed
-- separately at pay-as-you-go prices; charge it from cost_by_label.sql.
WITH reserved AS (
  SELECT
    e.principal.id AS account,
    IFNULL(SAFE_CAST(JSON_VALUE(TO_JSON(e), '$.provisionedthroughput.ptchargedinputtokencount') AS FLOAT64), 0)
      + IFNULL(SAFE_CAST(JSON_VALUE(TO_JSON(e), '$.provisionedthroughput.ptchargedoutputtokencount') AS FLOAT64), 0)
      AS pt_charged_tokens
  FROM `${PROJECT_ID}.${DATASET}.${USAGE_TABLE}`, UNNEST([jsonpayload_logging_inferenceeventlogentry]) AS e
  WHERE timestamp >= TIMESTAMP(@month_start)
    AND timestamp < TIMESTAMP(DATE_ADD(@month_start, INTERVAL 1 MONTH))
    AND e.traffictype = 'PROVISIONED_THROUGHPUT'
)
SELECT
  account,
  CAST(SUM(pt_charged_tokens) AS INT64) AS pt_charged_tokens,
  ROUND(100 * SUM(pt_charged_tokens) / SUM(SUM(pt_charged_tokens)) OVER (), 1) AS share_pct,
  ROUND(@fixed_fee * SUM(pt_charged_tokens) / SUM(SUM(pt_charged_tokens)) OVER (), 2) AS fixed_fee_share
FROM reserved
GROUP BY account
ORDER BY account;
